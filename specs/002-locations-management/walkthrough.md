# Walkthrough: Cities & Airports Management

**Date**: 2026-06-26

## Automated Validation

| Check | Command | Result |
|-------|---------|--------|
| Focused edit/delete action tests | `npx vitest run tests/integration/updateLocation.test.ts tests/integration/deleteLocation.test.ts` | PASS: 2 files, 11 tests |
| Full Vitest suite | `npm run test` | PASS: 22 files, 119 tests |
| Targeted ESLint for changed files | `npx eslint src/app/admin/locations/actions.ts src/components/locations-manager.tsx src/lib/validation/location.ts tests/integration/deleteLocation.test.ts tests/integration/updateLocation.test.ts` | PASS |

## Quickstart Scenario Notes

### Scenario 1: Admin Create Location

Covered by `tests/integration/createLocation.test.ts`, including valid creation, default active status, validation failure, duplicate-name handling, and generic database errors.

### Scenario 2: Admin Search & Paginate

Covered by `tests/unit/fetchLocations.test.ts`, including paginated fetching and sanitized search behavior.

### Scenario 3: Customer Booking Wizard Dropdowns

Covered by `tests/unit/groupLocations.test.ts` and the existing customer locations implementation, including active-only filtering, grouping by type, and alphabetical sorting.

## Edit And Delete Validation

- `tests/integration/updateLocation.test.ts` verifies partial update payloads, mapped response data, invalid UUID validation, duplicate-name handling, and not-found handling.
- `tests/integration/deleteLocation.test.ts` verifies unused-location deletion, invalid UUID validation, delete failures, booking reference blocks, and route pricing reference blocks.

## Manual Browser Validation

Manual browser validation was not run in this workspace because `.env.local` is not present, so the local app does not have Supabase connection settings. The implemented UI paths are ready for validation at `/admin/locations` once `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are configured.

## Known Repo-Wide Validation Notes

- `npm run lint` is currently blocked by pre-existing lint violations outside this feature in drivers, pricing, booking wizard, and Supabase client/test files.
- `npx tsc --noEmit` is currently blocked by pre-existing type errors in `tests/unit/booking-actions.test.ts`.
