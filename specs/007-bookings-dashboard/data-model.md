# Data Model: Bookings Dashboard

This document defines the database alterations, transient application state, and Zod validation schemas for F-06.

## 1. Database Schema Alterations

The `bookings` table is altered to support driver assignment and a new 'Completed' status.

### Updated `bookings` Schema (with Alterations)

| Column Name | Data Type | Key / Constraints | Default Value | Description |
|:---|:---|:---|:---|:---|
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | Unique internal identifier. |
| `booking_reference` | `UUID` | Unique | `gen_random_uuid()` | Booking reference for client and admin lookups. |
| `pickup_location_id` | `UUID` | Foreign Key (`locations.id`) | None | Pickup location ID. |
| `destination_location_id` | `UUID` | Foreign Key (`locations.id`) | None | Destination location ID. |
| `booking_date` | `DATE` | Not Null | None | Scheduled pickup date (YYYY-MM-DD). |
| `booking_time` | `TIME` | Not Null | None | Scheduled pickup time (HH:mm). |
| `price` | `NUMERIC` | Not Null, Check `price >= 0` | None | Verified route price. |
| `customer_name` | `TEXT` | Not Null | None | Passenger's full name. |
| `customer_email` | `TEXT` | Not Null | None | Passenger's email address. |
| `customer_phone` | `TEXT` | Not Null | None | Passenger's phone number. |
| `flight_number` | `TEXT` | Nullable | Null | Flight number (if provided). |
| `notes` | `TEXT` | Nullable | Null | Special notes/comments. |
| `status` | `TEXT` | Check `status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')` | `'Pending'` | **[ALTERED]** Expanded check constraint to allow `'Completed'`. |
| `driver_id` | `UUID` | Foreign Key (`drivers.id`) | Null | **[NEW]** Nullable assigned driver reference (`ON DELETE SET NULL`). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Not Null | `timezone('utc'::text, now())` | Creation timestamp. |

---

## 2. Application Types & Interfaces

```typescript
// Type representing a booking record as returned by database joins
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
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
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
```

---

## 3. Validation Schemas (Zod)

We enforce schema validation in the Server Actions using Zod:

```typescript
import { z } from 'zod';

// Schema for updating booking status
export const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  status: z.enum(['Pending', 'Confirmed', 'Completed', 'Cancelled'], {
    errorMap: () => ({ message: 'Invalid booking status selection.' }),
  }),
});

// Schema for assigning driver to a booking
export const AssignDriverSchema = z.object({
  bookingId: z.string().uuid({ message: 'Invalid booking ID.' }),
  driverId: z.string().uuid({ message: 'Invalid driver ID.' }).nullable(),
});
```
