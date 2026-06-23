# Quickstart: Pricing Management

This guide helps developers set up, validate, and verify the Pricing Management feature.

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

Run the following SQL DDL scripts directly in the Supabase SQL Editor to set up the `route_prices` table, constraints, and Row Level Security:

```sql
-- 1. Create table
CREATE TABLE route_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT check_different_locations CHECK (pickup_location_id <> destination_location_id),
  CONSTRAINT check_positive_price CHECK (price > 0),
  CONSTRAINT unique_pickup_destination UNIQUE (pickup_location_id, destination_location_id)
);

-- 2. Enable RLS
ALTER TABLE route_prices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
CREATE POLICY "Allow public read access to route prices"
  ON route_prices FOR SELECT
  USING (true);

-- Policy 2: Admin Operations
CREATE POLICY "Allow admin full access"
  ON route_prices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## Run Validation Tests (Vitest)

Execute the test suite verifying validation schemas and parsing constraints:

```bash
# Run tests once
npm run test

# Run tests in watch mode
npx vitest tests/unit/pricing.test.ts
```

Expected output:
```text
 ✓ tests/unit/pricing.test.ts (5 tests) 15ms
   ✓ Route price validation schemas
     ✓ should validate valid create inputs
     ✓ should reject invalid UUID formats
     ✓ should reject non-positive prices (<= 0)
     ✓ should reject identical pickup and destination IDs
     ✓ should validate valid update inputs
```

## Manual Verification Scenarios

### Scenario 1: Admin Create Route Price
1. Log in to the Admin Dashboard (e.g. at `/admin`).
2. Navigate to the **Pricing Management** tab.
3. Click **Add Route Price**.
4. Verify that the **From** and **To** dropdowns list only active locations.
5. Select a Pickup location, select a different Destination location, enter `75.00` in the price input field.
6. Submit the form. Verify that:
   - A success notification is shown.
   - The pricing rule is rendered in the table.

### Scenario 2: Verify Uniqueness & Same-Location Validation
1. Open the **Add Route Price** form.
2. Select the exact same Pickup and Destination locations you chose in Scenario 1, enter `80.00` in price, and click Save.
   - Verify that the system blocks submission and displays: *"A pricing rule for this route already exists."*
3. Open the **Add Route Price** form.
4. Select the same location in both the **From** and **To** dropdowns.
   - Verify that the system blocks submission and displays: *"Pickup and destination locations must be different."*

### Scenario 3: Verify Price Boundary Constraints
1. Open the **Add Route Price** form.
2. Select valid locations.
3. Enter `0` or `-10.00` in the price input field.
4. Click Save.
   - Verify that the system blocks submission and displays: *"Price must be a positive number greater than zero."*

### Scenario 4: Booking Wizard Pricing Lookup
1. Load the public booking wizard at `/booking`.
2. Select the Pickup location and Destination location configured in Scenario 1.
3. Verify that the booking wizard instantly retrieves and displays the price as `75.00`.
4. Select a location pair that does not have any route price configured.
5. Verify that the wizard displays a message indicating that online pricing is unavailable and prompts the customer to contact support.
