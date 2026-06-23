# Research: Drivers Management

This document outlines the technical investigations, decisions, and architectural rationales for the Drivers Management feature.

## 1. Database Schema and Constraints

### Decision
We will define a `drivers` table in PostgreSQL (managed via Supabase) with the following column specifications:
- `id`: `UUID` primary key, defaulting to `gen_random_uuid()`
- `name`: `TEXT`, not null
- `phone`: `TEXT`, not null, with a `UNIQUE` constraint
- `availability_status`: `TEXT`, not null, defaulting to `'Available'`, restricted via a `CHECK` constraint to `('Available', 'Busy', 'Inactive')`
- `created_at`: `TIMESTAMPTZ`, defaulting to `NOW()`

### Rationale
PostgreSQL check constraints are highly reliable for restricting domain values for statuses and are much easier to modify in future schema migrations compared to Postgres custom enum types (which require `ALTER TYPE ... ADD VALUE` or recreation of types). Standardizing the phone number field as a unique text column ensures no duplicate drivers can be added.

### Alternatives Considered
- **Postgres Custom Enum Type (`driver_status`)**: Declaring a custom enum type `CREATE TYPE driver_status AS ENUM ('Available', 'Busy', 'Inactive');` was considered. However, altering enum types in PostgreSQL can be cumbersome during migrations. Text column with a `CHECK` constraint provides the same data integrity with superior migration flexibility.
- **Soft Deletes column (`deleted_at`)**: A soft-delete column was evaluated. Since the driver status enum already contains an `'Inactive'` state to offboard or disable drivers, and because the spec specifies hard-deletion for this phase (AS-004), a soft-delete column was rejected to prevent premature complexity.

---

## 2. Server-Side Data Validation

### Decision
Use **Zod** schema schemas to define and parse inputs on both the frontend client components and backend server actions.
- Check name length (minimum 2 characters, maximum 100 characters).
- Enforce basic phone number shape (minimum 10 characters, allowing digits and optional leading `+`).
- Normalize phone numbers by stripping spaces, dashes, and parentheses in the validation parse step before database insertion.

### Rationale
Zod is already integrated and used for location and pricing validations. Schema-based parsing ensures strict runtime type-safety and provides clean, structured validation errors that can be rendered directly at the form-field level in the UI.

### Alternatives Considered
- **Client-only validation (HTML5 / native state check)**: Rejected because it is easily bypassed and does not guarantee backend data integrity.
- **Yup / Joi validation**: Rejected to maintain consistency with the existing validation architecture (`src/lib/validation/location.ts` and `pricing.ts`).

---

## 3. Server Actions and UI Composition

### Decision
- **Server Components**: Retrieve driver records directly from the Supabase client inside the main Next.js page component (`src/app/admin/drivers/page.tsx`).
- **Server Actions**: Define database mutations (create, update, delete) in a separate actions file (`src/app/admin/drivers/actions.ts`). Catch unique constraint database errors and return standardized JSON error payloads.
- **Client Components**: Build the add/edit driver modal form as a client component to handle local validation state, loading indicators, and server action responses.

### Rationale
This architecture leverages Next.js App Router best practices. Server components fetch data with zero client-side JavaScript overhead, and Server Actions provide secure, RPC-like database mutations. Returning structured status codes from actions allows the client form to render targeted error messages (e.g. mapping a database unique-constraint failure to a "Phone number already in use" message on the phone input field).

### Alternatives Considered
- **Next.js API Routes (`/api/drivers`)**: Considered for handling mutations. However, Server Actions reduce boilerplate, eliminate the need for manual API endpoint routing, and are fully type-safe out of the box when combined with TypeScript.

---

## 4. Test Suite Configuration

### Decision
Write tests using **Vitest** that cover:
- Zod schema validation (success cases, validation of short names, malformed phones).
- Phone number normalization logic.
- Mocked database checks for uniqueness and Server Action error mappings.

### Rationale
Vitest is configured for this workspace. It offers exceptional execution speed and full compatibility with Vite/ESM configurations.

### Alternatives Considered
- **Jest**: Rejected because the project constitution strictly mandates Vitest, and Jest requires complex configurations to work seamlessly with modern Next.js ESM setups.
