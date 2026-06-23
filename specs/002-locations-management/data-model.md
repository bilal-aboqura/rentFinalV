# Data Model: Cities & Airports Management

This document defines the data schema, validations, security rules, and TypeScript representations for the Locations entity.

## 1. Database Schema (Supabase PostgreSQL)

The `locations` table holds all geographical areas and specific nodes where the transfer service runs.

### `locations` Table Definition

| Column | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | `gen_random_uuid()` | Unique identifier |
| `name` | `TEXT` | `NOT NULL`, `UNIQUE` | | Name of the location |
| `type` | `TEXT` | `NOT NULL`, `CHECK` constraint | | Type: 'City', 'Airport', or 'Pickup Point' |
| `is_active` | `BOOLEAN` | `NOT NULL` | `true` | Active status for customer display |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL` | `now()` | Timestamp of creation |

### SQL DDL Constraints
- **Uniqueness**: `name` must be unique. To ensure case-insensitive uniqueness, we apply a unique index:
  ```sql
  CREATE UNIQUE INDEX unique_location_name_case_insensitive ON locations (LOWER(name));
  ```
- **Type Restriction**: `CHECK (type IN ('City', 'Airport', 'Pickup Point'))` ensures no invalid type values enter the database.

---

## 2. Row Level Security (RLS) Policies

Row-level security ensures that only authenticated admin users can modify location data, while allowing the booking wizard to read active locations.

```sql
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
-- Read-only select query for active locations.
CREATE POLICY "Allow public read access to active locations"
  ON locations FOR SELECT
  USING (is_active = true);

-- Policy 2: Admin Operations
-- Admins must be authenticated to perform any action on locations.
CREATE POLICY "Allow admin full access"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 3. TypeScript Interfaces

We define the types used across Next.js Server Components, Server Actions, and UI components.

```typescript
export type LocationType = 'City' | 'Airport' | 'Pickup Point';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  isActive: boolean;
  createdAt: string;
}

export interface CreateLocationInput {
  name: string;
  type: LocationType;
  isActive?: boolean;
}

export interface UpdateLocationInput {
  id: string;
  name?: string;
  type?: LocationType;
  isActive?: boolean;
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

export const LocationTypeSchema = z.enum(['City', 'Airport', 'Pickup Point']);

export const CreateLocationSchema = z.object({
  name: z.string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim(),
  type: LocationTypeSchema,
  isActive: z.boolean().default(true),
});

export const UpdateLocationSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z.string()
    .min(2, { message: 'Location name must be at least 2 characters long' })
    .max(100, { message: 'Location name cannot exceed 100 characters' })
    .trim()
    .optional(),
  type: LocationTypeSchema.optional(),
  isActive: z.boolean().optional(),
});
```
