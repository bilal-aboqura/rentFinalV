# Quickstart: Cities & Airports Management

This guide helps developers set up, validate, and verify the Cities & Airports Management feature.

## Prerequisites

1. **Node.js**: Version 18.0.0 or higher.
2. **Supabase Database**: An active Supabase project with connection environment variables set in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. **Dependencies**: Make sure Next.js and dev dependencies are installed:
   ```bash
   npm install
   ```

## Database Migration

Run the DDL scripts to set up the `locations` table, indices, and RLS policies. Refer to the schema defined in [data-model.md](../data-model.md#1-database-schema-supabase-postgresql).
You can run this DDL directly in the Supabase SQL Editor.

## Run Validation Tests (Vitest)

Execute the test suite verifying validation schemas and parsing constraints:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npx vitest
```

Expected output:
```text
 ✓ src/lib/validation/location.test.ts (4 tests) 12ms
   ✓ Location validation schemas
     ✓ should validate valid create inputs
     ✓ should reject invalid location types
     ✓ should reject names that are too short or empty
     ✓ should require a valid UUID for updates

 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  17:00:00
   Duration  45ms (transform 12ms, setup 0ms, collect 22ms)
```

## Manual Verification Scenarios

### Scenario 1: Admin Create Location
1. Log in to the Admin Dashboard (e.g. at `/admin`).
2. Navigate to the **Locations Management** tab.
3. Click **Add Location**, enter `London Heathrow`, select `Airport`, and check `Active`.
4. Submit the form. Verify that:
   - A success notification is shown.
   - The location is rendered in the table.
   - You cannot submit another location with the name `London Heathrow` (case-insensitively).

### Scenario 2: Admin Search & Paginate
1. Seed the database with 15 mock locations (e.g. using a mock seed action or database import).
2. Type `Logan` in the search bar. Verify the table filters to show only locations matching "Logan".
3. Clear search and navigate to Page 2. Verify that pagination options are updated and the correct subset of locations displays.

### Scenario 3: Customer Booking wizard Dropdowns
1. Deactivate `London Heathrow` from the Admin table (edit and uncheck `Active`).
2. Load the public booking wizard at `/booking`.
3. Open the origin or destination dropdown menus.
4. Verify that:
   - Only active locations are displayed.
   - `London Heathrow` is NOT listed.
   - Active locations are grouped by Type under header categories: "Cities", "Airports", and "Pickup Points", with alphabetical sorting.
