/**
 * T002 / T003 — Booking Step 1 Zod Validation Schemas
 * T005       — Booking Step 2 & Full Submission Zod Schemas
 * T003       — Booking Dashboard status update & driver assignment schemas
 *
 * Spec: specs/005-booking-wizard-step1/data-model.md
 *       specs/006-booking-wizard-step2/data-model.md
 *       specs/007-bookings-dashboard/data-model.md
 */

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Step 1 — Route & Time Schema
// ─────────────────────────────────────────────────────────────

/**
 * Zod schema for validating Step 1 booking form input.
 *
 * Rules:
 * - Both location IDs must be valid UUIDs
 * - Date must be in YYYY-MM-DD format
 * - Time must be in HH:mm format
 * - Pickup and destination locations must be different
 */
export const BookingStep1Schema = z
  .object({
    pickupLocationId: z.string().uuid({ message: 'Please select a valid pickup location.' }),
    destinationLocationId: z.string().uuid({ message: 'Please select a valid destination location.' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid date.' }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Please select a valid time.' }),
  })
  .refine((data) => data.pickupLocationId !== data.destinationLocationId, {
    message: 'Pickup and destination locations must be different.',
    path: ['destinationLocationId'],
  });

export type BookingStep1Input = z.infer<typeof BookingStep1Schema>;

// ─────────────────────────────────────────────────────────────
// Step 2 — Passenger Details Schema
// ─────────────────────────────────────────────────────────────

/**
 * E.164 international phone number regex.
 * Requires '+' prefix followed by country code and 7-14 digits.
 * Examples: +15551234567, +447911123456
 */
export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Zod schema for Step 2 passenger details form.
 */
export const BookingStep2Schema = z.object({
  customerName: z
    .string()
    .min(1, { message: 'Full name is required.' })
    .max(100, { message: 'Full name cannot exceed 100 characters.' }),
  customerEmail: z
    .string()
    .min(1, { message: 'Email address is required.' })
    .email({ message: 'Please enter a valid email address.' }),
  customerPhone: z
    .string()
    .min(1, { message: 'Phone number is required.' })
    .regex(E164_PHONE_REGEX, {
      message: 'Phone number must be in international E.164 format (e.g. +15551234567).',
    }),
  flightNumber: z
    .string()
    .max(20, { message: 'Flight number cannot exceed 20 characters.' })
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, { message: 'Special notes cannot exceed 1000 characters.' })
    .optional()
    .or(z.literal('')),
});

export type BookingStep2Input = z.infer<typeof BookingStep2Schema>;

// ─────────────────────────────────────────────────────────────
// Full Submission Schema — combines Step 1 + Step 2
// ─────────────────────────────────────────────────────────────

/**
 * Complete booking submission payload schema.
 * Validates merged Step 1 + Step 2 data before server persistence.
 */
export const SubmitBookingSchema = z
  .object({
    pickupLocationId: z.string().uuid({ message: 'Invalid pickup location.' }),
    destinationLocationId: z.string().uuid({ message: 'Invalid destination location.' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format.' }),
    time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Invalid time format.' }),
    price: z.number().nonnegative({ message: 'Price cannot be negative.' }),
    customerName: z.string().min(1, { message: 'Full name is required.' }),
    customerEmail: z.string().email({ message: 'Invalid email address.' }),
    customerPhone: z.string().regex(E164_PHONE_REGEX, {
      message: 'Phone number must be in E.164 format (e.g. +15551234567).',
    }),
    flightNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.pickupLocationId !== data.destinationLocationId, {
    message: 'Pickup and destination locations must be different.',
    path: ['destinationLocationId'],
  });

export type SubmitBookingPayload = z.infer<typeof SubmitBookingSchema>;

// ─────────────────────────────────────────────────────────────
// Application Interfaces
// ─────────────────────────────────────────────────────────────

/** Passenger details input structure (Step 2 form fields) */
export interface BookingStep2State {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  flightNumber?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// Booking Dashboard — Status & Driver Assignment Schemas (Spec 007)
// ─────────────────────────────────────────────────────────────

/** Booking lifecycle statuses managed from the admin dashboard. */
export const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that lock a booking from any further modifications. */
export const TERMINAL_BOOKING_STATUSES: ReadonlyArray<BookingStatus> = [
  'Completed',
  'Cancelled',
];

/** Returns true when a status can no longer be modified. */
export function isTerminalBookingStatus(status: string): boolean {
  return (TERMINAL_BOOKING_STATUSES as readonly string[]).includes(status);
}

/** Status filter values accepted by the bookings dashboard. */
export const BOOKING_STATUS_FILTERS = ['All', ...BOOKING_STATUSES] as const;
export type BookingStatusFilter = (typeof BOOKING_STATUS_FILTERS)[number];

/**
 * Zod schema for validating a booking status update payload.
 * Used by `updateBookingStatusAction` (Spec 007).
 */
export const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  status: z.enum(BOOKING_STATUSES, {
    errorMap: () => ({ message: 'Invalid booking status selection.' }),
  }),
});

export type UpdateBookingStatusInput = z.infer<typeof UpdateBookingStatusSchema>;

/**
 * Zod schema for validating a driver assignment payload.
 * `driverId` is nullable to allow un-assigning a driver.
 * Used by `assignDriverAction` (Spec 007).
 */
export const AssignDriverSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  driverId: z.string().uuid({ message: 'Invalid driver ID.' }).nullable(),
});

export type AssignDriverInput = z.infer<typeof AssignDriverSchema>;

/**
 * A booking record enriched with its joined route and driver display names.
 * Matches the nested Supabase select used by `fetchBookingsAction`.
 */
export interface BookingWithDetails {
  id: string;
  booking_reference: string;
  pickup_location_id: string;
  destination_location_id: string;
  booking_date: string;
  booking_time: string;
  price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  flight_number: string | null;
  notes: string | null;
  status: BookingStatus;
  driver_id: string | null;
  created_at: string;
  pickup: {
    name: string;
  };
  destination: {
    name: string;
  };
  driver?: {
    name: string;
  } | null;
}

