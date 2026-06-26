# Data Model: Trip Details Form & Booking Confirmation (Step 2)

This document defines the persistent database schema, transient application state, and Zod validation schemas for F-05.

## 1. Persistent Database Entities

This feature introduces a new `bookings` table to persist finalized passenger reservations.

### `bookings` Table Schema

| Column Name | Data Type | Key / Constraints | Default Value | Description |
|:---|:---|:---|:---|:---|
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | Unique internal identifier. |
| `booking_reference` | `UUID` | Unique | `gen_random_uuid()` | Cryptographically secure booking reference for customer lookups and confirmation rendering. |
| `pickup_location_id` | `UUID` | Foreign Key (`locations.id`) | None | Selected pickup location point. |
| `destination_location_id` | `UUID` | Foreign Key (`locations.id`) | None | Selected destination location point. |
| `booking_date` | `DATE` | Not Null | None | Scheduled pickup date (YYYY-MM-DD). |
| `booking_time` | `TIME` | Not Null | None | Scheduled pickup time (HH:mm). |
| `price` | `NUMERIC` | Not Null, Check `price >= 0` | None | Final verified route price quote. |
| `customer_name` | `TEXT` | Not Null | None | Passenger's full name. |
| `customer_email` | `TEXT` | Not Null | None | Passenger's contact email. |
| `customer_phone` | `TEXT` | Not Null | None | Passenger's contact phone number (E.164 format). |
| `flight_number` | `TEXT` | Nullable | Null | Flight number for airport pickups. |
| `notes` | `TEXT` | Nullable | Null | Special requests or remarks. |
| `status` | `TEXT` | Check `status IN ('Pending', 'Confirmed', 'Cancelled')` | `'Pending'` | Booking operational status. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Not Null | `timezone('utc'::text, now())` | Creation timestamp. |

### Indexes
* Unique index on `booking_reference`.
* Index on `pickup_location_id` and `destination_location_id` (foreign key performance optimization).

### Row Level Security (RLS) Policies
* **Public Insert**: Allowed for public (anon) users to register bookings. Default status must be `Pending`.
* **Public Select by Reference**: Allowed for public (anon) users only if the `booking_reference` UUID matches the request's custom header `x-booking-reference`.
* **Admin CRUD**: Full CRUD permissions granted to authenticated administrators.

---

## 2. Application Types & Interfaces

```typescript
// Passenger details input structure (Step 2 form fields)
export interface BookingStep2State {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  flightNumber?: string;
  notes?: string;
}

// Complete payload sent to the submitBooking Server Action
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
```

---

## 3. Validation Schemas (Zod)

We enforce schema validation for both Step 2 form inputs and the complete booking submission:

```typescript
import { z } from 'zod';

// E.164 phone validation regex (+ prefix followed by 7 to 15 digits)
export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

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

// Full booking submission validation (combines Step 1 parameters and Step 2 passenger inputs)
export const SubmitBookingSchema = z.object({
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
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different.',
  path: ['destinationLocationId'],
});
```
