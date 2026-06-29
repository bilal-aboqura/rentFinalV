# Tasks: New Request Alert (Feature F-08)

**Input**: Design documents from `/specs/008-new-request-alert/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Per the project constitution, tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation (TDD).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Exact file paths are specified in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment configuration

- [ ] T001 Configure and define the `ADMIN_EMAIL` environment variable in `.env.local`

---

## Phase 3: User Story 1 - Administrator Email Alerts (Priority: P1) 🎯 MVP

**Goal**: Automatically notify administrators via a formatted email when a customer submits a new booking request.

**Independent Test**: Complete a booking submission. Check the SMTP inbox and verify that a notification email is sent to the address configured in `ADMIN_EMAIL`, containing the booking reference, pickup/destination locations, date, time, customer name, and a link pointing to the admin panel.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T002 [P] [US1] Write unit tests for `sendAdminNotificationEmail` helper in `tests/unit/smtp.test.ts`
- [ ] T003 [P] [US1] Write unit tests for `submitBookingAction` admin email trigger in `tests/unit/booking-actions.test.ts`

### Implementation for User Story 1

- [ ] T004 [P] [US1] Implement `sendAdminNotificationEmail` helper function in `src/lib/mail/smtp.ts`
- [ ] T005 [US1] Modify `submitBookingAction` Server Action to invoke email helper in `src/app/actions/booking.ts` (depends on T004)

**Checkpoint**: User Story 1 is fully functional and can be tested independently.

---

## Phase 4: User Story 2 - Pending Bookings Badge in Admin Dashboard (Priority: P2)

**Goal**: Display a badge showing the count of currently pending bookings in the admin dashboard navigation header.

**Independent Test**: Navigate to the admin dashboard. Verify that next to the "Bookings" tab, a badge displays the count of pending bookings. Verify that creating a new booking increases the count and confirming/cancelling a booking decreases it.

### Tests for User Story 2 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US2] Write unit tests for `getPendingBookingsCount` Server Action in `tests/unit/booking-actions.test.ts`

### Implementation for User Story 2

- [ ] T007 [P] [US2] Implement `getPendingBookingsCount` Server Action in `src/app/admin/bookings/actions.ts`
- [ ] T008 [P] [US2] Create reusable `AdminNavbar` React Server Component in `src/components/admin-navbar.tsx` (depends on T007)
- [ ] T009 [US2] Update Admin Locations page to use `AdminNavbar` in `src/app/admin/locations/page.tsx` (depends on T008)
- [ ] T010 [US2] Update Admin Pricing page to use `AdminNavbar` in `src/app/admin/pricing/page.tsx` (depends on T008)
- [ ] T011 [US2] Update Admin Drivers page to use `AdminNavbar` in `src/app/admin/drivers/page.tsx` (depends on T008)
- [ ] T012 [US2] Update Admin Bookings page to use `AdminNavbar` in `src/app/admin/bookings/page.tsx` (depends on T008)

**Checkpoint**: User Story 2 is fully functional, and the dashboard count badge is active across all admin views.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T013 Verify system build and execute complete test suite using `npm run build` and `npx vitest run`
- [ ] T014 Run `quickstart.md` validation scenarios to manually verify email sending and badge updates in the browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **User Story 1 (Phase 3)**: Depends on Phase 1 setup completion.
- **User Story 2 (Phase 4)**: Can start in parallel with User Story 1, but depends on database connectivity.
- **Polish (Final Phase)**: Depends on all user story phases being complete.

### Parallel Opportunities

- Unit tests for both stories (T002, T003, T006) can be drafted in parallel.
- Creating the `AdminNavbar` component and the email helper functions can be done in parallel.
