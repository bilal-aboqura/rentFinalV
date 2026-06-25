'use server';

import { ServerActionResponse } from '@/types';

/**
 * Validates the selected booking date and time against the server's operational clock
 * to enforce a 2-hour minimum lead-time buffer.
 */
export function validateBookingSchedule(
  dateStr: string,
  timeStr: string,
  referenceDate: Date = new Date()
): { success: boolean; error?: string } {
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
    const result = validateBookingSchedule(date, time);
    if (!result.success) {
      return {
        success: false,
        validationErrors: {
          time: [result.error || 'Invalid booking schedule.']
        }
      };
    }
    return { success: true, data: { isValid: true } };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred during scheduling validation.' };
  }
}
