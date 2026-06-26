# Quickstart Validation Guide: Booking wizard Step 2

This document provides step-by-step instructions to verify the F-05 implementation, including test scripts and manual walkthrough flows.

## Prerequisites

1. Local database running (Supabase local emulator).
2. Environment variables set up in `.env.local` (e.g. SMTP config and Supabase keys).
3. Root dependencies installed (`npm install`).

---

## 1. Automated Unit Tests

Verify Zod schemas, E.164 phone formats, and schedule validations.

### Run Command
```bash
npx vitest run tests/unit/booking.test.ts
```

### Expected Output
All test cases under `Booking Wizard Step 2 Validations` and `BookingStep2Schema` pass successfully.

---

## 2. Integration / Server Action Verification

Validate the database save, RLS policies, and SMTP actions.

### Setup Test Database Records
Apply the SQL migration to create the `bookings` table:
```bash
npx supabase migration new create_bookings_table
# Add migration content from research.md and run local database reset/migration:
npx supabase db reset
```

### Test Script Execution
You can run a local test file to invoke `submitBookingAction` and query by reference:
```bash
npx vitest run tests/integration/booking-action.test.ts
```

---

## 3. Manual UI Flow Walkthrough

Verify the visual layout, validations, and transitions in the browser.

### Flow Scenario: Booking Completion
1. Open the dev environment (`npm run dev`) and navigate to the booking page (`http://localhost:3000/`).
2. Complete Step 1: Select distinct locations, date, and time. Verify a price is loaded.
3. Click "Next" to transition to Step 2.
4. Verify the **Order Summary Card** is displayed as read-only with correct Step 1 selections and price.
5. Try submitting with an invalid phone format (e.g. `123456`). Verify that a validation error displays.
6. Try submitting with missing required fields. Verify that input warnings trigger.
7. Enter valid details:
   - Full Name: `Jane Doe`
   - Email: `jane@example.com`
   - Phone: `+15551234567` (E.164)
   - Flight Number: `AB123` (Optional)
   - Notes: `Prefer child seat.` (Optional)
8. Click **Confirm Booking Request**. Verify that:
   - Button is disabled and shows a loading state.
   - Database record is created with status `Pending`.
   - Local wizard states are cleared.
   - View transitions to the **Success Confirmation** screen, displaying a unique UUID Booking Reference and thank-you message.
   - Check the local console/SMTP logs to confirm the transactional email was sent via SMTP.
9. Verify that no payment gateway screens or forms appear.
