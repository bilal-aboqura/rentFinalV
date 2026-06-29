/**
 * T002 / T003 — Booking Step 1 Zod Validation Schemas
 *
 * Spec: specs/005-booking-wizard-step1/data-model.md
 */

import { z } from 'zod';

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
