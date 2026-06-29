/**
 * T002 / T003 — Booking Step 1 Zod Validation Schemas
 * T005       — Booking Step 2 & Full Submission Zod Schemas
 *
 * Spec: specs/005-booking-wizard-step1/data-model.md
 *       specs/006-booking-wizard-step2/data-model.md
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

