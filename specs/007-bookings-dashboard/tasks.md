# Tasks: Bookings Dashboard

**Input**: Design documents from `/specs/007-bookings-dashboard/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validation checks

- [X] T001 [P] Verify that workspace directories and configuration files exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create Supabase migration to add `driver_id` and update status check constraints in `supabase/migrations/20260626000001_update_bookings_schema.sql`
- [X] T003 [P] Update validation schemas to add `UpdateBookingStatusSchema` and `AssignDriverSchema` in `src/lib/validation/booking.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View, Filter, and Paginate Bookings (Priority: P1) 🎯 MVP

**Goal**: List, pagination, and status filtering of bookings.

**Independent Test**: Verified by rendering `/admin/bookings` with test bookings, using pagination controls, and clicking status filters.

### Tests for User Story 1 (MANDATORY) ⚠️

- [X] T004 [P] [US1] Write failing unit test in `tests/unit/booking-dashboard.test.ts` for `fetchBookingsAction` validating pagination ranges and status filter queries.

### Implementation for User Story 1

- [X] T005 [P] [US1] Implement `fetchBookingsAction` in `src/app/admin/bookings/actions.ts` with pagination, filter, and locations/drivers joins.
- [X] T006 [P] [US1] Build interactive list view UI component in `src/components/bookings-manager.tsx` utilizing the fetch action and managing pagination/filter states.
- [X] T007 [US1] Build Server component page in `src/app/admin/bookings/page.tsx` to handle page routing, searchParams parsing, and loading `BookingsManager`.

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently.

---

## Phase 4: User Story 2 - View Booking Details and Update Status (Priority: P1)

**Goal**: View details modal and update booking status with terminal state lock checks.

**Independent Test**: Open details modal for Pending/Confirmed/Completed bookings, modify status, verify saving, and check that status is locked for Completed/Cancelled.

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T008 [P] [US2] Write failing unit tests in `tests/unit/booking-dashboard.test.ts` for `updateBookingStatusAction` validating input schemas and terminal status restrictions.

### Implementation for User Story 2

- [X] T009 [P] [US2] Implement `updateBookingStatusAction` in `src/app/admin/bookings/actions.ts` containing authentication checks and terminal state verification.
- [X] T010 [US2] Build modal UI component in `src/components/booking-details-modal.tsx` showing customer contact details, flight number, notes, and status transition buttons.
- [X] T011 [US2] Integrate `BookingDetailsModal` into `BookingsManager` to trigger details view on table row clicks and handle status saving.

**Checkpoint**: User Stories 1 and 2 are fully functional and integrated.

---

## Phase 5: User Story 3 - Assign Driver to Booking (Priority: P2)

**Goal**: Assign active drivers to bookings from the details modal, restricting assignment on terminal state bookings.

**Independent Test**: Select a driver in the dropdown, save, verify assignment; verify dropdown is disabled and assignments blocked on Completed/Cancelled bookings.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T012 [P] [US3] Write failing unit tests in `tests/unit/booking-dashboard.test.ts` for `assignDriverAction` validating driver ID assignment and terminal status locks.

### Implementation for User Story 3

- [X] T013 [P] [US3] Implement `assignDriverAction` in `src/app/admin/bookings/actions.ts` verifying authentication and terminal status locks before updating `driver_id`.
- [X] T014 [US3] Update `BookingDetailsModal` in `src/components/booking-details-modal.tsx` to display the driver assignment dropdown loaded with active drivers and disable it if terminal.

**Checkpoint**: Driver assignment functionality is complete and validated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, full testing, and validation check

- [X] T015 [P] Update developer documentation or quickstart validation run.
- [X] T016 [P] Run automated Vitest test suite and ensure 100% pass rate.
- [X] T017 Verify layout responsiveness across mobile and desktop viewports.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel or sequentially (US1 → US2 → US3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US2 (adds driver dropdown to modal)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
