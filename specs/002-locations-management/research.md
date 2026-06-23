# Research: Cities & Airports Management

This document details the architectural decisions and technical choices made for the Cities & Airports Management feature, adhering to the project constitution.

## Decision 1: Database (Supabase) Setup and Schema

### Chosen Solution
Create a PostgreSQL table `locations` in Supabase using the following DDL script:
```sql
-- Create locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('City', 'Airport', 'Pickup Point')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read active locations (for customer booking wizard)
CREATE POLICY "Allow public read access to active locations"
  ON locations FOR SELECT
  USING (is_active = true);

-- Allow authenticated admin users full access
CREATE POLICY "Allow admin full access"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Rationale
- Using Supabase's native UUID (`gen_random_uuid()`) is standard for secure, non-sequential identifiers.
- A CHECK constraint on `type` guarantees database-level integrity for the enum attributes.
- Enabling RLS is a strict requirement of the project constitution. Using `authenticated` role filters ensures only logged-in admin users can perform write operations, while allowing public read of active locations for the customer-facing booking wizard.

### Alternatives Considered
- **Enum type instead of CHECK constraint**: While native PostgreSQL `CREATE TYPE` is clean, CHECK constraints are easier to modify without migrations if new types need to be added or deprecated in the future.
- **Sequelize ORM**: The previous feature (001) used Sequelize, but this feature is built with Next.js + Supabase. Using Supabase JS client with native SQL migrations or schema management aligns directly with the constitution's Supabase Integration principle.

---

## Decision 2: Backend Framework & Server Actions

### Chosen Solution
Use Next.js 14+ App Router with React Server Components (RSC) for data fetching and Next.js Server Actions for mutation operations.
- Admin locations list and search are fetched directly in a Server Component page using the Supabase Server Client.
- Write operations (Create, Update, Delete) are defined as Server Actions with validation handled by `zod` and role-based checks.

### Rationale
- Server-side rendering (RSC) ensures fast initial load times and eliminates client-side API fetch overhead.
- Server Actions reduce client-side bundle size, isolate server-side database connections, and run seamlessly without the need for API endpoints.
- Type safety is maintained from the database level to the UI components.

### Alternatives Considered
- **REST API Routes (`/api/locations/route.ts`)**: Rejected in favor of Server Actions, which are cleaner to integrate with forms, support progressive enhancement, and reduce route-definition boilerplate.

---

## Decision 3: Frontend Layout & Data Table (Search/Pagination)

### Chosen Solution
Create a responsive admin interface styled with Tailwind CSS and utilizing `lucide-react` icons.
- **Pagination**: Implement server-side pagination via URL search parameters (e.g. `?page=1&query=London`). The RSC page reads these search params and fetches the matching subset using Supabase `range(from, to)`.
- **Search**: Perform case-insensitive searches using Supabase `.ilike('name', `%${query}%`)` triggered by a client-side search input that updates the URL with a debounce.
- **Forms**: Create a reusable modal or slide-over component for Add/Edit forms that use HTML5 validation and display validation errors returned by Server Actions.

### Rationale
- Storing pagination and search queries in the URL enables bookmarking, page refreshes, and deep linking without state loss.
- Server-side search and pagination are highly scalable and performant for larger data volumes compared to client-side filtering.

### Alternatives Considered
- **Client-Side State (useState)**: Rejected because it does not support deep-linking/bookmarking and degrades performance when the database grows.

---

## Decision 4: Unit Testing Framework

### Chosen Solution
Use **Vitest** for testing location input validation and parsing logic.
- We will write test suites for input validations (e.g., verifying Name length, checking enum types, checking case-insensitive uniqueness check logic).
- Tests will be run locally using `npm run test` or `npx vitest`.

### Rationale
- Matches the project constitution: "Strictly enforce test-driven development (TDD) as a non-negotiable process. Write failing unit and integration tests using Vitest first."
- Vitest provides extremely fast, watch-mode execution and matches Jest's assertion API while integrating natively with Vite and ES modules.

### Alternatives Considered
- **Jest**: Explicitly banned by the user requirements and project constitution.
