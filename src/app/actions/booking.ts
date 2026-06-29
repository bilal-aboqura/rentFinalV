'use server';

/**
 * T004 / T014 — Booking Wizard Server Actions
 *
 * Spec: specs/005-booking-wizard-step1/contracts/actions.md
 *
 * Exports:
 * - validateBookingSchedule(): Pure helper for 2-hour lead time check (testable, sync)
 * - checkRoutePriceAction(): Server Action — fetches route price from Supabase
 * - validateBookingScheduleAction(): Server Action — validates date+time buffer server-side
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

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
