# Data Model: Booking Wizard (Step 1: Route & Time)

This document defines the TypeScript interfaces and validation schemas for the Step 1 booking parameters.

## 1. Persistent Database Entities

This feature queries existing persistent database tables. It does not introduce new database tables.

### `locations` Table (Reused from Location Management)
Used to fetch active pickup and destination points.
- `id`: `UUID` (Primary Key)
- `name`: `TEXT` (Unique)
- `type`: `TEXT` ('City' | 'Airport' | 'Pickup Point')
- `is_active`: `BOOLEAN` (Filters for `true`)

### `route_prices` Table (Reused from Pricing Management)
Used to retrieve flat-rate prices for selected location pairs.
- `id`: `UUID` (Primary Key)
- `pickup_location_id`: `UUID` (Foreign Key)
- `destination_location_id`: `UUID` (Foreign Key)
- `price`: `NUMERIC` (> 0)

---

## 2. Transient Application State

The wizard transient state represents in-progress booking selections. This state is captured in memory and passed to subsequent steps.

### `BookingStep1State` Interface

```typescript
export interface BookingStep1State {
  pickupLocationId: string;
  destinationLocationId: string;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:mm
  price: number | null;
}
```

---

## 3. Validation Schemas (Zod)

We enforce schema validation for Step 1 data inputs:

```typescript
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
```
