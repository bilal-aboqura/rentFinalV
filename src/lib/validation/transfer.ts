/**
 * Validation schema for the airport/hotel transfer booking flow.
 *
 * Each endpoint (From / To) resolves to a real location row
 * (`locationId`) used for pricing, plus a human-readable `text`
 * detail (airport name, hotel name, full address, or "other").
 *
 * Email is OPTIONAL — WhatsApp/phone is the primary contact.
 * Flight number is REQUIRED whenever either endpoint is an airport.
 * Time is 24-hour (HH:mm).
 */

import { z } from 'zod';

export const ENDPOINT_TYPES = ['airport', 'hotel', 'address', 'other'] as const;
export type EndpointType = (typeof ENDPOINT_TYPES)[number];

export const TRIP_TYPES = ['one_way', 'round_trip'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const PAYMENT_METHODS = ['cash', 'card_pos', 'bank_transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BOOKING_LANGUAGES = ['ar', 'en'] as const;
export type BookingLanguage = (typeof BOOKING_LANGUAGES)[number];

/** Pragmatic international phone: optional + then 6-15 digits. */
export const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const EndpointSchema = z.object({
  type: z.enum(ENDPOINT_TYPES),
  locationId: z.string().min(1, 'Pickup/drop-off location is required.'),
  text: z.string().max(200).optional().or(z.literal('')),
});

const HospitalitySelectionSchema = z.object({
  optionId: z.string().uuid('Hospitality option is invalid.'),
  quantity: z.number().int().min(1, 'Hospitality quantity must be at least 1.'),
});

export const TransferBookingSchema = z
  .object({
    language: z.enum(BOOKING_LANGUAGES).default('ar'),
    customerName: z
      .string()
      .trim()
      .min(2, 'Name is required.')
      .max(100, 'Name cannot exceed 100 characters.'),
    customerPhone: z
      .string()
      .trim()
      .min(1, 'A valid phone number is required.')
      .regex(PHONE_REGEX, 'A valid phone number is required (e.g. +9665XXXXXXXX).'),
    customerEmail: z
      .string()
      .trim()
      .max(150, 'Email cannot exceed 150 characters.')
      .optional()
      .or(z.literal(''))
      .refine((v) => v === '' || v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: 'Invalid email address.',
      }),
    tripType: z.enum(TRIP_TYPES),
    pickup: EndpointSchema,
    dropoff: EndpointSchema,
    date: z.string().regex(DATE_REGEX, 'Date is required.'),
    time: z.string().regex(TIME_REGEX, 'Time is required (24-hour HH:mm).'),
    flightNumber: z.string().trim().max(30).optional().or(z.literal('')),
    // Round-trip return leg
    returnDate: z.string().optional().or(z.literal('')),
    returnTime: z.string().optional().or(z.literal('')),
    returnFlightNumber: z.string().trim().max(30).optional().or(z.literal('')),
    returnPickup: EndpointSchema.optional(),
    returnDropoff: EndpointSchema.optional(),
    // Car + payment
    carId: z.string().min(1, 'Please select a car.'),
    vehicleClass: z.enum(['standard', 'executive', 'van']),
    passengerCount: z.number().int().min(1, 'Passenger count is required.').max(20),
    hospitalitySelections: z.array(HospitalitySelectionSchema).default([]),
    paymentMethod: z.enum(PAYMENT_METHODS),
    notes: z.string().trim().max(1000).optional().or(z.literal('')),
    // Client-displayed price (re-verified server-side).
    price: z.number().nonnegative(),
  })
  .refine((data) => data.pickup.locationId !== data.dropoff.locationId, {
    message: 'Pickup and drop-off must be different.',
    path: ['dropoff', 'locationId'],
  })
  .refine(
    (data) =>
      !(data.pickup.type === 'airport' || data.dropoff.type === 'airport') ||
      (data.flightNumber?.trim().length ?? 0) > 0,
    {
      message: 'Flight number is required when an airport is selected.',
      path: ['flightNumber'],
    },
  )
  .refine(
    (data) =>
      data.tripType !== 'round_trip' ||
      (
        DATE_REGEX.test(data.returnDate ?? '') &&
        TIME_REGEX.test(data.returnTime ?? '') &&
        !!data.returnPickup?.locationId &&
        !!data.returnDropoff?.locationId &&
        data.returnPickup.locationId !== data.returnDropoff.locationId
      ),
    {
      message: 'Return route, date, and time are required for a round trip.',
      path: ['returnDate'],
    },
  )
  .superRefine((data, ctx) => {
    const uniqueIds = new Set<string>();

    data.hospitalitySelections.forEach((selection, index) => {
      if (selection.quantity > data.passengerCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hospitalitySelections', index, 'quantity'],
          message: 'Hospitality quantity cannot exceed passenger count.',
        });
      }

      if (uniqueIds.has(selection.optionId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['hospitalitySelections', index, 'optionId'],
          message: 'Duplicate hospitality option selected.',
        });
      }

      uniqueIds.add(selection.optionId);
    });
  });

export type TransferBookingInput = z.infer<typeof TransferBookingSchema>;

export interface TransferEndpoint {
  type: EndpointType;
  locationId: string;
  text: string;
}

export interface TransferBookingPayload {
  language: BookingLanguage;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripType: TripType;
  pickup: TransferEndpoint;
  dropoff: TransferEndpoint;
  date: string;
  time: string;
  flightNumber?: string;
  returnDate?: string;
  returnTime?: string;
  returnFlightNumber?: string;
  returnPickup?: TransferEndpoint;
  returnDropoff?: TransferEndpoint;
  carId: string;
  vehicleClass: 'standard' | 'executive' | 'van';
  passengerCount: number;
  hospitalitySelections: TransferHospitalitySelection[];
  paymentMethod: PaymentMethod;
  notes?: string;
  price: number;
}

export interface TransferHospitalitySelection {
  optionId: string;
  quantity: number;
}
