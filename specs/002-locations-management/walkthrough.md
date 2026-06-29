# Walkthrough: Cities & Airports Management

**Date**: 2026-06-29

## Automated Validation

| Check | Command | Result |
|-------|---------|--------|
| Validation unit tests | `npx vitest run tests/unit/validation.test.ts` | PASS: 1 file, 12 tests |
| fetchLocations unit tests | `npx vitest run tests/unit/fetchLocations.test.ts` | PASS: 1 file, 4 tests |
| groupLocations unit tests | `npx vitest run tests/unit/groupLocations.test.ts` | PASS: 1 file, 6 tests |
| createLocation integration tests | `npx vitest run tests/integration/createLocation.test.ts` | PASS: 1 file, 6 tests |
| updateLocation integration tests | `npx vitest run tests/integration/updateLocation.test.ts` | PASS: 1 file, 5 tests |
| deleteLocation integration tests | `npx vitest run tests/integration/deleteLocation.test.ts` | PASS: 1 file, 5 tests |
| Full Vitest suite | `npx vitest run` | PASS: 9 files, 71 tests |

## Files Created / Modified

### New Source Files
- `src/lib/validation/location.ts` — Zod schemas (CreateLocationSchema, UpdateLocationSchema) with `'City' | 'Airport' | 'Pickup Point'` types
- `src/app/admin/locations/data.ts` — Server-side paginated/searchable fetch function
- `src/app/admin/locations/actions.ts` — Server Actions: create, update, delete (with referential integrity), getActive
- `src/app/admin/locations/page.tsx` — Admin Locations RSC page at `/admin/locations`
- `src/app/admin/locations/layout.tsx` — Layout with sidebar nav for `/admin/locations` routes
- `src/app/admin/locations/api/route.ts` — API route for client-side pagination/search
- `src/components/locations-manager.tsx` — Client component: table, search, pagination, create/edit/delete modals
- `src/components/ui/table.tsx` — Reusable DataTable component
- `src/components/ui/pagination.tsx` — Pagination component with prev/next/numbered buttons
- `src/components/booking-wizard.tsx` — Customer-facing grouped location dropdowns (GroupedLocationSelect + BookingWizard)
- `src/lib/utils/groupLocations.ts` — Utility: filters inactive, groups by type, sorts alphabetically
- `src/lib/api/customerLocations.ts` — Customer API module for grouped active locations

### New Test Files
- `tests/unit/validation.test.ts` — 12 tests for Zod schema validation
- `tests/unit/fetchLocations.test.ts` — 4 tests for paginated/searchable data fetching
- `tests/unit/groupLocations.test.ts` — 6 tests for grouping/sorting utilities
- `tests/integration/createLocation.test.ts` — 6 integration tests for createLocationAction
- `tests/integration/updateLocation.test.ts` — 5 integration tests for updateLocationAction
- `tests/integration/deleteLocation.test.ts` — 5 integration tests for deleteLocationAction (referential integrity)

### Modified Files
- `src/app/admin/dashboard/layout.tsx` — Added Locations nav link to sidebar

## Quickstart Scenario Coverage

### Scenario 1: Admin Create Location
Covered by `tests/integration/createLocation.test.ts`, including valid creation, default active status, validation failure, duplicate-name handling, and generic database errors.

### Scenario 2: Admin Search & Paginate
Covered by `tests/unit/fetchLocations.test.ts`, including paginated fetching, case-insensitive search, and correct range calculation for page 2.

### Scenario 3: Customer Booking Wizard Dropdowns
Covered by `tests/unit/groupLocations.test.ts`, including active-only filtering, grouping by type (City/Airport/Pickup Point), and alphabetical sorting.

## Referential Integrity
`deleteLocationAction` checks for references in both `bookings` and `pricing_rules` tables before allowing deletion. Covered by `tests/integration/deleteLocation.test.ts` (booking block, pricing rule block, and successful deletion of unreferenced locations).

## Manual Browser Validation

Manual browser validation was not run because `.env.local` is not present in this workspace (no Supabase connection settings). The implemented UI paths are ready for validation:
- **Admin Locations Page**: `/admin/locations`
- **Customer Booking Wizard**: `/booking` (GroupedLocationSelect integration)

Once `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured, manual testing can proceed per the [quickstart.md](./quickstart.md) scenarios.

## Database Migration Required

Run the following SQL in the Supabase SQL Editor before using the UI:

```sql
-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('City', 'Airport', 'Pickup Point')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique name index
CREATE UNIQUE INDEX unique_location_name_case_insensitive ON locations (LOWER(name));

-- RLS policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active locations"
  ON locations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admin full access"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Known Notes

- `npm run lint` may report pre-existing lint violations outside this feature (in drivers, pricing, booking wizard files).
- `npx tsc --noEmit` may report pre-existing type errors in `tests/unit/booking-actions.test.ts`.
- The booking wizard component (`src/components/booking-wizard.tsx`) is a standalone component that can be integrated into the existing booking form for grouped dropdowns.
