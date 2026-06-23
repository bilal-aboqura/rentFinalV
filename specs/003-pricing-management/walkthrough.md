# Walkthrough: Pricing Management (F-02)

This document summarizes the completed implementation, testing, and validation of the **Pricing Management (F-02)** feature.

## Changes Made

### 1. Database Schema
* Created a Supabase migration file [20260623000001_create_route_prices.sql](../../supabase/migrations/20260623000001_create_route_prices.sql):
  * Creates `route_prices` table.
  * Added `unique_pickup_destination` unique constraint on `(pickup_location_id, destination_location_id)`.
  * Added check constraints to ensure `price > 0` and `pickup_location_id <> destination_location_id`.
  * Enabled Row Level Security (RLS) with public read access and full admin access for authenticated users.

### 2. Validation & Types
* Created shared TypeScript types in [src/types/index.ts](../../src/types/index.ts) representing `Location`, `RoutePrice`, input types, and action response.
* Created Zod validation schemas in [src/lib/validation/pricing.ts](../../src/lib/validation/pricing.ts) to enforce formatting, price boundaries, and non-equal locations.

### 3. Server Actions & Business Logic
* Created Server Actions in [src/app/admin/pricing/actions.ts](../../src/app/admin/pricing/actions.ts):
  * `fetchRoutePricesAction`: Retrieves paginated route prices with location joins.
  * `createRoutePriceAction`: Handles creation with database constraint error checking.
  * `updateRoutePriceAction`: Handles pricing modifications.
  * `deleteRoutePriceAction`: Handles route price deletions.
  * `getActiveLocationsAction`: Utility to fetch active locations.
  * `getRoutePriceAction`: Performs real-time customer price lookup.

### 4. User Interface
* Created [src/components/pricing-form.tsx](../../src/components/pricing-form.tsx) client modal component for adding/editing route prices, with Zod validation.
* Created [src/components/pricing-manager.tsx](../../src/components/pricing-manager.tsx) client component to coordinate data tables, alerts, and pagination transitions.
* Created [src/components/booking-wizard.tsx](../../src/components/booking-wizard.tsx) customer-facing calculator component.
* Updated [src/app/admin/pricing/page.tsx](../../src/app/admin/pricing/page.tsx) to render the admin dashboard.
* Overwrote [src/app/page.tsx](../../src/app/page.tsx) with a premium landing page featuring the live instant price calculator.

---

## Testing & Validation Results

### 1. Automated Unit Tests
A comprehensive test suite of 25 tests verifies Zod schemas, fetching, updates, and deletes:
* [tests/unit/pricing.test.ts](../../tests/unit/pricing.test.ts) (Validation tests)
* [tests/unit/pricing-fetch.test.ts](../../tests/unit/pricing-fetch.test.ts) (Fetch mock tests)
* [tests/unit/pricing-create.test.ts](../../tests/unit/pricing-create.test.ts) (Create mock tests)
* [tests/unit/pricing-update.test.ts](../../tests/unit/pricing-update.test.ts) (Update mock tests)
* [tests/unit/pricing-delete.test.ts](../../tests/unit/pricing-delete.test.ts) (Delete mock tests)
* [tests/unit/booking-pricing.test.ts](../../tests/unit/booking-pricing.test.ts) (Lookup mock tests)

Running the test suite results in all tests passing successfully:
```text
 RUN  v4.1.9 C:/Users/anasa/Desktop/rentFinal

 ✓ tests/unit/booking-pricing.test.ts (3 tests) 10ms
 ✓ tests/unit/pricing-update.test.ts (3 tests) 16ms
 ✓ tests/unit/pricing-create.test.ts (3 tests) 16ms
 ✓ tests/unit/pricing-delete.test.ts (2 tests) 6ms
 ✓ tests/unit/validation.test.ts (5 tests) 13ms
 ✓ tests/unit/pricing-fetch.test.ts (2 tests) 6ms
 ✓ tests/unit/pricing.test.ts (7 tests) 15ms

 Test Files  7 passed (7)
      Tests  25 passed (25)
   Start at  17:37:15
   Duration  758ms
```

### 2. Manual Verification
* Built with strict Tailwind CSS (v4) styles, Outfit/Geist fonts, glassmorphism modals, and dark backgrounds.
* Excluded vehicle classes as per user feedback, enforcing a clean single flat price per route.
* Pagination and URL syncing operate correctly using router query strings.
