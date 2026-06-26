# Interface Contract: Booking Submission & Retrieval

This document defines the interface contracts for the booking submission server action and client-side data retrieval for F-05.

## 1. Next.js Server Action: `submitBookingAction`

The `submitBookingAction` server action is called by the frontend booking wizard component to validate details, perform server-side price checks, insert the booking record, and dispatch a SMTP transactional notification.

### Action Signature

```typescript
export async function submitBookingAction(
  payload: SubmitBookingPayload
): Promise<ServerActionResponse<{ bookingReference: string }>>
```

### Payload Schema (`SubmitBookingPayload`)

See [data-model.md](../data-model.md#2-application-types--interfaces) for typescript definitions.
* Validated against `SubmitBookingSchema` on the server before database operations.

### Output Structure (`ServerActionResponse`)

On Success:
```json
{
  "success": true,
  "data": {
    "bookingReference": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

On Validation or Business Logic Error:
```json
{
  "success": false,
  "validationErrors": {
    "customerPhone": ["Phone number must be in E.164 format (e.g. +15551234567)."],
    "price": ["Price verification failed. Price does not match."]
  }
}
```

On Unexpected Error (e.g. SMTP or Database down):
```json
{
  "success": false,
  "error": "Failed to save booking. Please try again later."
}
```

---

## 2. Client-side Database Retrieval Contract

To render the booking success page, the client can query the database directly using the public Supabase client. To pass the RLS select gate, the client MUST include the `x-booking-reference` header.

### Query Format

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('bookings')
  .select(`
    id,
    booking_reference,
    pickup_date,
    pickup_time,
    price,
    customer_name,
    customer_email,
    customer_phone,
    flight_number,
    notes,
    status,
    pickup:locations!pickup_location_id(name),
    destination:locations!destination_location_id(name)
  `)
  .eq('booking_reference', bookingReference)
  .headers({
    'x-booking-reference': bookingReference
  })
  .single();
```

### RLS Guard Validation
If the `x-booking-reference` header is missing, incorrect, or doesn't match the row's `booking_reference`, the database returns zero rows (or a 406 / Not Found error), preventing unauthorized guest lookups.
