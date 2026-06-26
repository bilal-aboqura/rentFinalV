# Implementation Plan: Status Change Alert

**Branch**: `009-status-change-alert` | **Date**: 2026-06-26 | **Spec**: [specs/009-status-change-alert/spec.md](spec.md)

**Input**: Feature specification from `/specs/009-status-change-alert/spec.md`

## Summary

Feature F-09 automatically sends transactional SMTP emails to guest customers when their booking status changes or driver details are assigned.
- **Confirmed**: Sends booking, route, and driver details (if present).
- **Cancelled**: Sends a polite cancellation notice.
- **Driver Assignment**: Re-triggers the confirmation email if a driver is assigned/updated on a booking that is already confirmed.
All email dispatch is performed asynchronously and non-blocking using un-awaited promises to guarantee zero responsiveness overhead for the admin dashboard.

## Technical Context

**Language/Version**: TypeScript / Node.js (Next.js 16)

**Primary Dependencies**: `nodemailer`, `@supabase/supabase-js`, `zod`

**Storage**: Supabase (PostgreSQL) `bookings` and `drivers` tables

**Testing**: Vitest (`npm run test`)

**Target Platform**: Next.js App Router (Server Actions running on Node.js runtime)

**Project Type**: Web application

**Performance Goals**: Non-blocking dispatch (<5ms overhead to Server Action execution thread)

**Constraints**: RESTRICTED to customer email notification only; no SMS/push notifications.

**Scale/Scope**: Small transactional volume matched to admin operations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Clean and Modular Code**: Yes. Email templates and Nodemailer transporters are centralized in [smtp.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/lib/mail/smtp.ts).
- **Strict TypeScript**: Yes. Parameters and return types for new SMTP helpers are strictly typed.
- **Secure Server-Side Operations**: Yes. Database updates and selects are secured through the standard Supabase client with active session checks.
- **Vitest TDD**: Yes. Tests will be updated and validated before final code modifications are committed.

## Project Structure

### Documentation (this feature)

```text
specs/009-status-change-alert/
├── plan.md              # This file
├── research.md          # Research notes
├── data-model.md        # Data model details
├── quickstart.md        # Runnable verification guide
└── contracts/           # API & Actions contracts
    ├── smtp.md
    └── booking-actions.md
```

### Source Code

```text
src/
├── app/
│   └── admin/
│       └── bookings/
│           └── actions.ts         # MODIFY: updateBookingStatusAction and assignDriverAction
├── lib/
│   └── mail/
│       └── smtp.ts                # MODIFY: add sendBookingConfirmedEmail and sendBookingCancelledEmail
└── types/
    └── index.ts                   # MODIFY: extend BookingWithDetails.driver with phone
tests/
└── unit/
    └── booking-dashboard.test.ts   # MODIFY: add Vitest tests for email triggers
```

**Structure Decision**: Standard Next.js server and testing structure. Real paths to `src/app/admin/bookings/actions.ts` and `src/lib/mail/smtp.ts` will be updated to include the email dispatch triggers.

## Proposed Changes

---

### Shared Library & Mail Services

#### [MODIFY] [smtp.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/lib/mail/smtp.ts)
- Add `sendBookingConfirmedEmail` function to compose and dispatch confirmation emails (contains booking ref, pickup, destination, date, time, customer name, and driver name + phone).
- Add `sendBookingCancelledEmail` function to compose and dispatch cancellation emails (contains booking ref, customer name).

#### [MODIFY] [index.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/types/index.ts)
- Modify the `BookingWithDetails` type to include optional `phone?: string` under the `driver` sub-property.

---

### Admin Bookings Server Actions

#### [MODIFY] [actions.ts](file:///c:/Users/anasa/Desktop/rentFinal/src/app/admin/bookings/actions.ts)
- Update `BookingRow` to expect `driver: { name: string; phone: string } | null`.
- Update Supabase select inside `updateBookingStatusAction` and `assignDriverAction` to retrieve `driver:drivers(name, phone)`.
- Inside `updateBookingStatusAction`: after successful database update, trigger `sendBookingConfirmedEmail` (if status is 'Confirmed') or `sendBookingCancelledEmail` (if status is 'Cancelled') in a non-blocking way.
- Inside `assignDriverAction`: after successful database update, check if `currentBooking.status === 'Confirmed'`. If true, trigger `sendBookingConfirmedEmail` in a non-blocking way.

---

### Test Suite

#### [MODIFY] [booking-dashboard.test.ts](file:///c:/Users/anasa/Desktop/rentFinal/tests/unit/booking-dashboard.test.ts)
- Mock `@/lib/mail/smtp` with Vitest mocks for `sendBookingConfirmedEmail` and `sendBookingCancelledEmail`.
- Add test assertions to verify `sendBookingConfirmedEmail` is called on confirmation status updates and driver assignments (where current status is already Confirmed).
- Add test assertions to verify `sendBookingCancelledEmail` is called on cancellation.
- Verify no email is dispatched for completed/pending transitions or driver assignments on non-confirmed bookings.

---

## Verification Plan

### Automated Tests
- Run tests via command:
  ```bash
  npm run test
  ```

### Manual Verification
- Deploy/run locally and confirm emails are sent to configured SMTP inbox (e.g. Mailtrap) during:
  - Status updates to Confirmed and Cancelled.
  - Driver assignment updates on already Confirmed bookings.
