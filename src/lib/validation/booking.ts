import { z } from 'zod';

export const BookingStep1Schema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Please select a valid pickup location.' }),
  destinationLocationId: z.string().uuid({ message: 'Please select a valid destination location.' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid date.' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Please select a valid time.' }),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different.',
  path: ['destinationLocationId'],
});

export const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

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

export const SubmitBookingSchema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Please select a valid pickup location.' }),
  destinationLocationId: z.string().uuid({ message: 'Please select a valid destination location.' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid date.' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Please select a valid time.' }),
  price: z.number().nonnegative({ message: 'Price cannot be negative.' }),
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
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, { message: 'Special notes cannot exceed 1000 characters.' })
    .optional()
    .nullable()
    .or(z.literal('')),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different.',
  path: ['destinationLocationId'],
});

export const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled'], {
    message: 'Invalid booking status selection.',
  }),
});

export const AssignDriverSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  driverId: z.string().uuid({ message: 'Invalid driver ID.' }).nullable(),
});

