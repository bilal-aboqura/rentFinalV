# Research & Decision Log: Pricing Management

This document records the key architectural decisions and research findings for implementing the **Pricing Management (F-02)** feature.

## Decisions

### 1. Database Schema & Constraints
* **Decision**: Create a `route_prices` table with fields `id` (uuid, PK), `pickup_location_id` (uuid, FK to `locations.id`), `destination_location_id` (uuid, FK to `locations.id`), and `price` (numeric, not null, `CHECK (price > 0)`). A UNIQUE constraint `unique_route_pair` will be defined on `(pickup_location_id, destination_location_id)`.
* **Rationale**: Enforcing relational integrity and uniqueness at the database level guarantees data consistency, preventing duplicate route prices from being entered even under concurrent requests or race conditions.
* **Alternatives Considered**: Application-level unique checking before inserting. Rejected because it is vulnerable to race conditions (Time-of-Check to Time-of-Use).

### 2. Next.js App Router Data Architecture
* **Decision**: Use React Server Components (RSC) for initial page loading and fetching pricing rules, joining with the `locations` table to display location names. Use Next.js Server Actions for Create, Update, and Delete operations.
* **Rationale**: Leverages the App Router's server-side rendering for optimal load times and security. Moving database mutation logic into Server Actions allows us to keep credentials and database access strictly on the server, enforcing Supabase Row Level Security (RLS) policies.
* **Alternatives Considered**: Direct Client-Side Supabase SDK fetching. Rejected to maintain strict server/client separation and secure operational boundaries as mandated by the project constitution.

### 3. Price Validation and Error Handling
* **Decision**: Use `zod` for validating pricing input parameters on both the client (for immediate form feedback) and server (within Server Actions). Handle PostgreSQL/Supabase database constraint violations (such as foreign key or uniqueness errors) by catching database errors and returning clear, user-friendly validation messages.
* **Rationale**: Double-layered validation (client + server) ensures resilience against invalid inputs. Catching specific database uniqueness errors (`23505` code in PostgreSQL) allows the admin UI to display a contextual "This route already has a price rule configured" message instead of a generic server crash page.
* **Alternatives Considered**: Trusting client-side validation only. Rejected as it violates standard secure coding practices.

### 4. Unit Testing Framework
* **Decision**: Use Vitest to write unit tests for the pricing validation schemas (`zod` schemas) and helper functions.
* **Rationale**: Aligns strictly with the project constitution (Principle IV), providing faster execution times and compatibility with the existing TypeScript setup without adding Jest dependencies.
* **Alternatives Considered**: Jest. Rejected because Jest is excluded by the project constitution.
