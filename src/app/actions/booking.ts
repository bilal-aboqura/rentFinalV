'use server';

import { ServerActionResponse } from '@/types';

/**
 * Validates the selected booking date and time against the server's operational clock
 * to enforce a 2-hour minimum lead-time buffer.
 */
export async function validateBookingSchedule(
  dateStr: string,
  timeStr: string,
  referenceDate: Date = new Date()
): Promise<{ success: boolean; error?: string }> {
  // Validate format of dateStr (YYYY-MM-DD) and timeStr (HH:mm)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { success: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }
  if (!/^\d{2}:\d{2}$/.test(timeStr)) {
    return { success: false, error: 'Invalid time format. Expected HH:mm.' };
  }

  // Parse date and time in server's local operational timezone
  const bookingDateTime = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(bookingDateTime.getTime())) {
    return { success: false, error: 'Invalid date or time value.' };
  }

  const minLeadTimeMs = 2 * 60 * 60 * 1000; // 2 hours in ms
  const diffMs = bookingDateTime.getTime() - referenceDate.getTime();

  if (diffMs < 0) {
    return { success: false, error: 'Booking date and time cannot be in the past.' };
  }

  if (diffMs < minLeadTimeMs) {
    return { success: false, error: 'Bookings must be made at least 2 hours in advance.' };
  }

  return { success: true };
}

/**
 * Next.js Server Action wrapper for scheduling validations.
 */
export async function validateBookingScheduleAction(
  date: string,
  time: string
): Promise<ServerActionResponse<{ isValid: boolean }>> {
  try {
    const result = await validateBookingSchedule(date, time);
    if (!result.success) {
      return {
        success: false,
        validationErrors: {
          time: [result.error || 'Invalid booking schedule.']
        }
      };
    }
    return { success: true, data: { isValid: true } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during scheduling validation.';
    return { success: false, error: message };
  }
}

import { createClient } from '@/lib/supabase/server';
import { SubmitBookingSchema } from '@/lib/validation/booking';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/mail/smtp';

export interface SubmitBookingPayload {
  pickupLocationId: string;
  destinationLocationId: string;
  date: string;
  time: string;
  price: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  flightNumber?: string;
  notes?: string;
}

/**
 * Next.js Server Action to validate and persist a guest booking reservation.
 */
export async function submitBookingAction(
  payload: SubmitBookingPayload
): Promise<ServerActionResponse<{ bookingReference: string }>> {
  try {
    // 1. Zod Schema Validation
    const parsed = SubmitBookingSchema.safeParse(payload);
    if (!parsed.success) {
      // Flatten errors to Record<string, string[]> matching type definition
      const errors = parsed.error.flatten().fieldErrors;
      const validationErrors: Record<string, string[]> = {};
      Object.entries(errors).forEach(([key, value]) => {
        if (value) validationErrors[key] = value;
      });
      return { success: false, validationErrors };
    }

    // 2. Server-side Lead-time validation
    const scheduleResult = await validateBookingSchedule(payload.date, payload.time);
    if (!scheduleResult.success) {
      return {
        success: false,
        validationErrors: {
          time: [scheduleResult.error || 'Invalid booking schedule.']
        }
      };
    }

    const supabase = await createClient();

    // 3. Server-side Price Verification against Pricing Matrix
    const { data: priceRow, error: priceError } = await supabase
      .from('route_prices')
      .select('price')
      .eq('pickup_location_id', payload.pickupLocationId)
      .eq('destination_location_id', payload.destinationLocationId)
      .single();

    if (priceError || !priceRow) {
      return {
        success: false,
        error: 'No price defined for the selected route. Booking cannot be made online.'
      };
    }

    const dbPrice = Number(priceRow.price);
    const clientPrice = Number(payload.price);
    if (Math.abs(dbPrice - clientPrice) > 0.01) {
      return {
        success: false,
        error: 'Price verification failed. The selected route price has changed or been modified.'
      };
    }

    // 4. Save Booking to DB
    const { data: bookingRow, error: insertError } = await supabase
      .from('bookings')
      .insert({
        pickup_location_id: payload.pickupLocationId,
        destination_location_id: payload.destinationLocationId,
        booking_date: payload.date,
        booking_time: payload.time,
        price: clientPrice,
        customer_name: payload.customerName,
        customer_email: payload.customerEmail,
        customer_phone: payload.customerPhone,
        flight_number: payload.flightNumber || null,
        notes: payload.notes || null,
        status: 'Pending'
      })
      .select(`
        booking_reference,
        pickup:locations!pickup_location_id(name),
        destination:locations!destination_location_id(name)
      `)
      .single();

    if (insertError || !bookingRow) {
      return {
        success: false,
        error: insertError?.message || 'Failed to save booking record.'
      };
    }

    const ref = bookingRow.booking_reference;
    const typedBookingRow = bookingRow as unknown as {
      booking_reference: string;
      pickup: { name: string } | null;
      destination: { name: string } | null;
    };
    const pickupName = typedBookingRow.pickup?.name || 'Selected Pickup';
    const destinationName = typedBookingRow.destination?.name || 'Selected Destination';

    // 5. Trigger SMTP Confirmation Email in background (non-blocking)
    // Resolves gracefully internally on failure so it does not block user flow
    sendBookingConfirmationEmail(
      payload.customerEmail,
      payload.customerName,
      ref,
      pickupName,
      destinationName,
      payload.date,
      payload.time,
      clientPrice
    ).catch(err => {
      console.error('Asynchronous email trigger failure:', err);
    });

    // Trigger SMTP Admin Notification Email in background (non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendAdminNotificationEmail({
        reference: ref,
        pickupName,
        destinationName,
        date: payload.date,
        time: payload.time,
        customerName: payload.customerName,
        adminEmail,
      }).catch(err => {
        console.error('Asynchronous admin email trigger failure:', err);
      });
    }

    return {
      success: true,
      data: { bookingReference: ref }
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during booking confirmation.';
    return {
      success: false,
      error: message
    };
  }
}

