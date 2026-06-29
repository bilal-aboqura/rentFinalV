'use server';

/**
 * T004 / T014 — Booking Wizard Server Actions (Spec 005)
 * T010        — submitBookingAction (Spec 006)
 *
 * Spec: specs/005-booking-wizard-step1/contracts/actions.md
 *       specs/006-booking-wizard-step2/contracts/submit-booking.md
 *
 * Exports:
 * - validateBookingSchedule(): Pure helper for 2-hour lead time check (testable, sync)
 * - checkRoutePriceAction(): Server Action — fetches route price from Supabase
 * - validateBookingScheduleAction(): Server Action — validates date+time buffer server-side
 * - submitBookingAction(): Server Action — validates, verifies price, persists booking, sends email
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { SubmitBookingSchema } from '@/lib/validation/booking';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail/smtp';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

export interface ScheduleValidationResult {
  isValid: boolean;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// T004 / T014 — Pure helper: timezone-safe 2-hour lead time check
// ─────────────────────────────────────────────────────────────

/**
 * Validates whether the given date/time pair satisfies the 2-hour lead time requirement.
 *
 * The booking date/time is parsed without a timezone suffix so Node.js resolves
 * it using the server's local operational timezone — the single source of truth
 * per the spec (Decision 3 in research.md).
 *
 * @param dateStr - YYYY-MM-DD
 * @param timeStr - HH:mm
 * @param referenceDate - Current time to compare against (defaults to now; injectable for testing)
 */
export function validateBookingSchedule(
  dateStr: string,
  timeStr: string,
  referenceDate: Date = new Date()
): ScheduleValidationResult {
  // Parse without timezone suffix → uses server local timezone
  const bookingDate = new Date(`${dateStr}T${timeStr}:00`);

  if (isNaN(bookingDate.getTime())) {
    return { isValid: false, error: 'Invalid date or time provided.' };
  }

  const twoHoursFromNow = new Date(referenceDate.getTime() + 2 * 60 * 60 * 1000);

  if (bookingDate < twoHoursFromNow) {
    return {
      isValid: false,
      error: 'Bookings must be made at least 2 hours in advance.',
    };
  }

  return { isValid: true };
}

// ─────────────────────────────────────────────────────────────
// Server Action: Check Route Price
// Contract: specs/005-booking-wizard-step1/contracts/actions.md#1
// ─────────────────────────────────────────────────────────────

/**
 * Retrieves the flat-rate price for a given pickup/destination pair.
 * Returns { price: null } when no pricing is configured for the route.
 */
export async function checkRoutePriceAction(
  pickupLocationId: string,
  destinationLocationId: string
): Promise<ServerActionResponse<{ price: number | null }>> {
  const pickupParsed = z.string().uuid().safeParse(pickupLocationId);
  const destParsed = z.string().uuid().safeParse(destinationLocationId);

  if (!pickupParsed.success || !destParsed.success) {
    return { success: false, error: 'Invalid location IDs.' };
  }

  if (pickupLocationId === destinationLocationId) {
    return { success: false, error: 'Pickup and destination locations must be different.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('route_prices')
      .select('price')
      .eq('pickup_location_id', pickupLocationId)
      .eq('destination_location_id', destinationLocationId)
      .maybeSingle();

    if (error) {
      return { success: false, error: 'Failed to retrieve route pricing information.' };
    }

    return {
      success: true,
      data: { price: data ? Number(data.price) : null },
    };
  } catch {
    return { success: false, error: 'Failed to retrieve route pricing information.' };
  }
}

// ─────────────────────────────────────────────────────────────
// Server Action: Validate Booking Schedule
// Contract: specs/005-booking-wizard-step1/contracts/actions.md#2
// ─────────────────────────────────────────────────────────────

/**
 * Server-side validation for the booking date and time.
 * Enforces the 2-hour lead time buffer using the server's local operational timezone.
 */
export async function validateBookingScheduleAction(
  date: string,
  time: string
): Promise<ServerActionResponse<{ isValid: boolean }>> {
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const timeValid = /^\d{2}:\d{2}$/.test(time);

  if (!dateValid || !timeValid) {
    return {
      success: false,
      validationErrors: {
        time: ['Please provide a valid date (YYYY-MM-DD) and time (HH:mm).'],
      },
    };
  }

  const result = validateBookingSchedule(date, time);

  if (!result.isValid) {
    return {
      success: false,
      validationErrors: {
        time: [result.error ?? 'Bookings must be made at least 2 hours in advance of the current server time.'],
      },
    };
  }

  return { success: true, data: { isValid: true } };
}

// ─────────────────────────────────────────────────────────────
// T010 — Server Action: Submit Booking
// Contract: specs/006-booking-wizard-step2/contracts/submit-booking.md
// ─────────────────────────────────────────────────────────────

/**
 * Validates the full booking payload, verifies the route price against the
 * database (tamper prevention), inserts the booking record, dispatches a
 * transactional confirmation email to the passenger, dispatches a "New Booking
 * Request" alert to the configured ADMIN_EMAIL, and returns the booking
 * reference UUID.
 *
 * Price verification: The client-submitted price is compared against the
 * server-side pricing matrix. If it differs by more than $0.01, the action
 * rejects with a validation error.
 *
 * Email dispatch is non-fatal: SMTP failures are logged but do not cause
 * the action to return an error — the booking is already persisted.
 */
export async function submitBookingAction(
  payload: unknown
): Promise<ServerActionResponse<{ bookingReference: string }>> {
  // ── Step 1: Schema validation ──
  const parsed = SubmitBookingSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: fieldErrors,
    };
  }

  const {
    pickupLocationId,
    destinationLocationId,
    date,
    time,
    price,
    customerName,
    customerEmail,
    customerPhone,
    flightNumber,
    notes,
  } = parsed.data;

  try {
    const supabase = await createClient();

    // ── Step 2: Server-side price verification (tamper prevention) ──
    const { data: priceRow, error: priceError } = await supabase
      .from('route_prices')
      .select('price')
      .eq('pickup_location_id', pickupLocationId)
      .eq('destination_location_id', destinationLocationId)
      .maybeSingle();

    if (priceError) {
      return { success: false, error: 'Failed to verify route pricing. Please try again.' };
    }

    if (!priceRow) {
      return {
        success: false,
        validationErrors: {
          price: ['No pricing is available for this route. Please start over and select a valid route.'],
        },
      };
    }

    const serverPrice = Number(priceRow.price);
    if (Math.abs(serverPrice - price) > 0.01) {
      return {
        success: false,
        validationErrors: {
          price: ['Price verification failed. Price does not match.'],
        },
      };
    }

    // ── Step 3: Fetch location names for email ──
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', [pickupLocationId, destinationLocationId]);

    const pickupName = locations?.find((l) => l.id === pickupLocationId)?.name ?? 'Unknown';
    const destName   = locations?.find((l) => l.id === destinationLocationId)?.name ?? 'Unknown';

    // ── Step 4: Insert booking record ──
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        pickup_location_id: pickupLocationId,
        destination_location_id: destinationLocationId,
        booking_date: date,
        booking_time: time,
        price: serverPrice,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        flight_number: flightNumber || null,
        notes: notes || null,
        status: 'Pending',
      })
      .select('booking_reference')
      .single();

    if (insertError || !booking) {
      console.error('[submitBookingAction] DB insert error:', insertError);
      return { success: false, error: 'Failed to save booking. Please try again later.' };
    }

    const bookingReference = booking.booking_reference as string;

    // ── Step 5: Dispatch confirmation email (non-fatal) ──
    void sendBookingConfirmationEmail({
      bookingReference,
      customerName,
      customerEmail,
      pickupLocationName: pickupName,
      destinationLocationName: destName,
      bookingDate: date,
      bookingTime: time,
      price: serverPrice,
      flightNumber: flightNumber ?? null,
      notes: notes ?? null,
    });

    // ── Step 6: Dispatch admin "New Booking Request" alert (non-fatal) ──
    // Spec 008 (F-08): notify the administrator of a new pending request.
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      void sendAdminNotificationEmail({
        reference: bookingReference,
        pickupName,
        destinationName: destName,
        date,
        time,
        customerName,
        adminEmail,
      });
    }

    return { success: true, data: { bookingReference } };
  } catch (error) {
    console.error('[submitBookingAction] Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again later.' };
  }
}
