# Quickstart Validation Guide: Status Change Alert

This document provides runnable validation scenarios to prove that Feature F-09: Status Change Alert works end-to-end.

## Prerequisites

Ensure the following environment variables are set in `.env.local` for SMTP operations (or using local mock configs):

```bash
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=test_smtp_user
SMTP_PASS=test_smtp_password
SMTP_FROM=noreply@airporttransfers.com
```

---

## 1. Automated Tests

Run the Vitest test suite to verify the logic and mock SMTP functions:

```bash
npm run test
```

Expected outcome: The unit tests in `tests/unit/booking-dashboard.test.ts` pass, validating correct trigger logic for status updates and driver assignments.

---

## 2. Manual Verification Scenarios

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000/admin/bookings](http://localhost:3000/admin/bookings) in your browser.

### Scenario A: Booking Confirmation (with Driver Assigned)

1. Select a **Pending** booking that already has a driver assigned.
2. Click **Confirm Booking**.
3. Verify that the booking status updates to **Confirmed** and a success message appears.
4. Verify that the SMTP server (e.g. Mailtrap or console logs) shows a "Booking Confirmation" email sent to the customer containing:
   - Success message
   - Booking Reference
   - Trip Details (pickup, destination, date, time)
   - Assigned Driver's Name and Phone Number

### Scenario B: Driver Assignment to a Confirmed Booking

1. Select a **Confirmed** booking that is currently unassigned (or has a driver assigned).
2. Use the driver select dropdown to assign or update the driver.
3. Verify the assignment completes successfully.
4. Verify that a new "Booking Confirmation" email is sent to the customer containing the updated driver's name and phone number.

### Scenario C: Booking Cancellation

1. Select a **Pending** or **Confirmed** booking.
2. Click **Cancel Booking**.
3. Verify the status updates to **Cancelled**.
4. Verify that a cancellation notification email is sent to the customer containing:
   - A polite cancellation notice
   - Booking Reference
