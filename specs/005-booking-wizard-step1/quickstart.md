# Quickstart: Booking Wizard (Step 1)

This guide helps developers set up, validate, and verify Step 1 of the Booking Wizard.

## Prerequisites

1. **Active Locations & Pricing Rules**: Ensure you have configured active locations and route pricing in the database.
2. **Local Server Running**:
   ```bash
   npm run dev
   ```

## Run Validation Tests (Vitest)

Execute the unit test suite verifying component logic and timezone-safe buffer validations:

```bash
# Run tests
npx vitest tests/unit/booking.test.ts
```

---

## Manual Verification Scenarios

### Scenario 1: Verify Location Options & Sorting
1. Open the public booking page at `/`.
2. Inspect the **Pickup Location** and **Destination** dropdowns.
3. Verify that:
   - Only active locations (e.g. `is_active = true`) are present.
   - Locations are separated into optgroup headers: `"Cities"`, `"Airports"`, and `"Pickup Points"`.
   - Locations within each group are sorted alphabetically.

### Scenario 2: Prevent Same-Location Selections
1. Open the booking wizard page.
2. Select `Austin Airport` in the **Pickup Location** dropdown.
3. Select `Austin Airport` in the **Destination** dropdown.
4. Verify that:
   - The UI blocks submission or displays a warning: *"Pickup and destination locations must be different."*
   - The "Next" button is disabled.

### Scenario 3: Live Pricing Retrieve & Form Enablement
1. Select `Austin Airport` as Pickup and `Austin Downtown` as Destination (ensure a route price of e.g. `$75.00` exists in `route_prices`).
2. Verify that:
   - A loading indicator (spinner) is displayed briefly.
   - The price is retrieved dynamically and displayed clearly: `$75.00`.
   - The "Next" button becomes enabled.

### Scenario 4: Missing Route Price Handling
1. Select `Austin Airport` as Pickup and a location that does not have any route price configured.
2. Verify that:
   - A loading indicator is displayed briefly.
   - A message is shown: *"Online pricing is unavailable for this specific route. Please use our Contact Form."*
   - The "Next" button is disabled.
   - Clicking the Contact Form link redirects you to `/contact`.

### Scenario 5: Schedule Selection and Past Date Disablement
1. Open the date picker.
2. Verify that all dates prior to today's date are disabled (cannot be selected).

### Scenario 6: Same-Day 2-Hour Lead Time Validation
1. Select today's date.
2. Open the time picker and select a time that is **less than 2 hours** in the future relative to the server's current local operational time.
3. Click "Next" (if enabled) or verify that a validation warning is displayed: *"Bookings must be made at least 2 hours in advance."*
4. Select a time **more than 2 hours** in the future. Verify that the schedule is validated and the warning disappears.
