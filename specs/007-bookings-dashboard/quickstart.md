# Quickstart: Bookings Dashboard Validation Guide

This guide provides step-by-step instructions to verify the Bookings Management Dashboard implementation.

## Prerequisites

1. Ensure the Supabase database migrations are applied:
   ```bash
   # Run migrations locally or link to local database container
   supabase migration db push
   ```
2. Seed the database with test data (Locations, Drivers, and Bookings).

## Automated Verification

Run the Vitest test suite to verify the Server Action validation logic and terminal status locks:

```bash
npm run test tests/unit/booking-dashboard.test.ts
```

### Expected Results
* 100% of unit tests pass.
* Tests verify that the `updateBookingStatusAction` throws/fails when attempting to transition a Completed or Cancelled booking.
* Tests verify that `assignDriverAction` throws/fails when attempting to assign a driver to a Completed or Cancelled booking.

## Manual Verification Flow

### Scenario 1: Initial Render & Pagination
1. Login to the admin panel and navigate to `/admin/bookings`.
2. Verify that the table renders customer bookings sorted by `created_at` descending.
3. Verify that Booking Reference, Route, Date & Time, Customer Name, Price, and Status badge are displayed correctly.
4. Verify pagination displays 10 rows and clicking "Next" loads the next set of bookings.

### Scenario 2: Status Filtering
1. Click the status filter dropdown/tabs and select "Pending".
2. Verify only bookings with "Pending" status are displayed.
3. Select "Completed" and verify only completed bookings are shown.

### Scenario 3: Viewing Details & Status Update
1. On a "Pending" booking, click "View Details".
2. Verify the modal opens and displays passenger details (Email, Phone, Flight Number, Special Notes).
3. Select "Confirmed" from the status dropdown and click "Save".
4. Verify the modal closes, a success toast appears, and the status badge on the row updates to "Confirmed".

### Scenario 4: Driver Assignment
1. Open the details of a "Confirmed" booking.
2. Select an active driver from the dropdown list and click "Save".
3. Verify that the driver's name is associated with the booking in the table or details modal.

### Scenario 5: Terminal State Lock
1. Open the details of a booking that has status "Completed" or "Cancelled".
2. Verify that the status dropdown and driver assignment dropdown are disabled.
3. (Optional integration test) Manually call `updateBookingStatusAction` with a terminal state booking ID and confirm it returns `success: false` with the error: *"Cannot modify a booking that is in a terminal state (Completed or Cancelled)."*
