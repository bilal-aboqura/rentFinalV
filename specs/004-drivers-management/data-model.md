# Data Model: Drivers Management

This document defines the database schemas, integrity constraints, Row-Level Security (RLS) rules, and application-level validation structures for the Drivers Management feature.

## 1. Database Schema

### Table: `drivers`

| Column Name | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY` | `gen_random_uuid()` | Unique identifier for each driver |
| `name` | `TEXT` | `NOT NULL` | - | Full name of the driver |
| `phone` | `TEXT` | `NOT NULL`, `UNIQUE` | - | Normalized unique phone number |
| `availability_status`| `TEXT` | `NOT NULL`, `CHECK` | `'Available'` | Status (`'Available'`, `'Busy'`, `'Inactive'`) |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL` | `now()` | Record creation timestamp |

```sql
-- DDL Script
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    availability_status TEXT NOT NULL DEFAULT 'Available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Status validation constraint
    CONSTRAINT check_driver_status CHECK (availability_status IN ('Available', 'Busy', 'Inactive')),
    -- Minimum name length constraint
    CONSTRAINT check_name_length CHECK (char_length(trim(name)) >= 2)
);

-- Index for searching drivers by name or phone
CREATE INDEX idx_drivers_search ON public.drivers USING gin (to_tsvector('english', name || ' ' || phone));
-- Index for quick status checks (used in scheduling/bookings)
CREATE INDEX idx_drivers_status ON public.drivers (availability_status);
```

---

## 2. Row-Level Security (RLS) Policies

By default, RLS is enabled on the `drivers` table. In accordance with project security practices:
- **Anonymous/Public Read/Write**: Denied.
- **Admin Users**: Granted full access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).

```sql
-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated administrators can perform all actions
CREATE POLICY "Admins have full access to drivers"
ON public.drivers
FOR ALL
TO authenticated
USING (
  -- Assumes standard admin role checking in user metadata
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

---

## 3. Application Validation Schemas (Zod)

### Create Driver Schema
Used to validate inputs when registering a new driver. Normalizes phone numbers during parsing.

```typescript
import { z } from 'zod';

export const CreateDriverSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform(val => val.trim()),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    // Normalize: remove spaces, dashes, parentheses, keep digits and optional leading +
    .transform(val => val.replace(/[^\d+]/g, '')),
  availability_status: z.enum(['Available', 'Busy', 'Inactive'], {
    errorMap: () => ({ message: 'Invalid availability status' })
  }).default('Available')
});
```

### Update Driver Schema
Used when updating an existing driver. Inherits fields from the creation schema and requires a valid `UUID`.

```typescript
export const UpdateDriverSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name must not exceed 100 characters' })
    .transform(val => val.trim())
    .optional(),
  phone: z.string()
    .min(10, { message: 'Phone number must be at least 10 characters long' })
    .max(20, { message: 'Phone number must not exceed 20 characters' })
    .transform(val => val.replace(/[^\d+]/g, ''))
    .optional(),
  availability_status: z.enum(['Available', 'Busy', 'Inactive']).optional()
});
```
