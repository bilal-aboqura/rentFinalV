# Data Model: Pricing Management

This document defines the data schema, validations, security rules, and TypeScript representations for the Pricing Rule (Route Price) entity.

## 1. Database Schema (Supabase PostgreSQL)

The `route_prices` table holds the pricing configuration for routes from a pickup location to a destination location.

### `route_prices` Table Definition

| Column | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | Unique identifier |
| `pickup_location_id` | `UUID` | Foreign Key (`locations.id`), `NOT NULL` | | Start location of the route |
| `destination_location_id` | `UUID` | Foreign Key (`locations.id`), `NOT NULL` | | End location of the route |
| `price` | `NUMERIC` | `NOT NULL`, `CHECK (price > 0)` | | Flat-rate price for the route |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL` | `now()` | Timestamp of creation |

### SQL DDL Constraints
- **Uniqueness Constraint**: Enforce a unique combination of `pickup_location_id` and `destination_location_id` to prevent duplicate prices for the same route.
  ```sql
  ALTER TABLE route_prices 
    ADD CONSTRAINT unique_pickup_destination UNIQUE (pickup_location_id, destination_location_id);
  ```
- **Same Location Prevent Constraint**: Enforce that the pickup location and destination location must be different.
  ```sql
  ALTER TABLE route_prices 
    ADD CONSTRAINT check_different_locations CHECK (pickup_location_id <> destination_location_id);
  ```
- **Positive Price Constraint**: Enforce that price is strictly greater than 0.
  ```sql
  ALTER TABLE route_prices 
    ADD CONSTRAINT check_positive_price CHECK (price > 0);
  ```

---

## 2. Row Level Security (RLS) Policies

Row-level security ensures that only authenticated admin users can modify pricing data, while allowing the booking wizard and public frontend to read prices.

```sql
ALTER TABLE route_prices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
-- Read-only select query for route prices.
CREATE POLICY "Allow public read access to route prices"
  ON route_prices FOR SELECT
  USING (true);

-- Policy 2: Admin Operations
-- Admins must be authenticated to perform any write/modify operations on route prices.
CREATE POLICY "Allow admin full access"
  ON route_prices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 3. TypeScript Interfaces

We define the types used across Next.js Server Components, Server Actions, and UI components.

```typescript
export interface RoutePrice {
  id: string;
  pickupLocationId: string;
  destinationLocationId: string;
  price: number;
  createdAt: string;
  // Joined fields for display
  pickupLocationName?: string;
  destinationLocationName?: string;
}

export interface CreateRoutePriceInput {
  pickupLocationId: string;
  destinationLocationId: string;
  price: number;
}

export interface UpdateRoutePriceInput {
  id: string;
  pickupLocationId?: string;
  destinationLocationId?: string;
  price?: number;
}

export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: { [key in keyof T]?: string[] };
}
```

---

## 4. Validation Rules

We enforce constraints at the application level using Zod schema validation before saving records:

```typescript
import { z } from 'zod';

export const CreateRoutePriceSchema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }),
  price: z.number({ invalid_type_error: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' }),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});

export const UpdateRoutePriceSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }).optional(),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }).optional(),
  price: z.number({ invalid_type_error: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' })
    .optional(),
}).refine(data => {
  if (data.pickupLocationId && data.destinationLocationId) {
    return data.pickupLocationId !== data.destinationLocationId;
  }
  return true;
}, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});
```
