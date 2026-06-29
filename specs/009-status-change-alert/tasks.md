# Tasks: Status Change Alert

**Input**: Design documents from `/specs/009-status-change-alert/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Vitest tests are mandatory and must be written first (TDD), ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Configure local SMTP test settings (if needed) in `.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Extend `BookingWithDetails` interface in `src/types/index.ts` to support optional `phone?: string` under the `driver` sub-property
- [ ] T003 Update `BookingRow` interface in `src/app/admin/bookings/actions.ts` to include `phone: string` in the driver property

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Email Notification on Booking Confirmation (Priority: P1) 🎯 MVP

**Goal**: Automatically notify the guest customer via email when their booking is confirmed, or when a driver is assigned to a confirmed booking, containing passenger and driver details.

**Independent Test**: Confirm a booking or assign a driver to a confirmed booking via the bookings dashboard, and verify SMTP email delivery with passenger/driver info.

### Tests for User Story 1 (MANDATORY) ⚠️

- [ ] T004 [P] [US1] Write Vitest unit tests in `tests/unit/smtp.test.ts` for the new `sendBookingConfirmedEmail` SMTP helper function
- [ ] T005 [US1] Write failing Vitest unit tests in `tests/unit/booking-dashboard.test.ts` to mock SMTP and assert that `sendBookingConfirmedEmail` is called when a booking status transitions to "Confirmed" via `updateBookingStatusAction`
- [ ] T006 [US1] Write failing Vitest unit tests in `tests/unit/booking-dashboard.test.ts` to assert that `sendBookingConfirmedEmail` is called when a driver is assigned/updated via `assignDriverAction` on a booking already in "Confirmed" status, and NOT called on other statuses

### Implementation for User Story 1

- [ ] T007 [P] [US1] Implement `sendBookingConfirmedEmail` SMTP helper function in `src/lib/mail/smtp.ts` using Nodemailer
- [ ] T008 [US1] Update `updateBookingStatusAction` in `src/app/admin/bookings/actions.ts` to select `driver:drivers(name, phone)` and trigger `sendBookingConfirmedEmail` asynchronously on "Confirmed" status transitions
- [ ] T009 [US1] Update `assignDriverAction` in `src/app/admin/bookings/actions.ts` to select `driver:drivers(name, phone)` and trigger `sendBookingConfirmedEmail` asynchronously if the booking status is already "Confirmed"

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Email Notification on Booking Cancellation (Priority: P2)

**Goal**: Automatically notify the guest customer via a polite email when their booking is marked as Cancelled.

**Independent Test**: Cancel a booking via the bookings dashboard and verify SMTP cancellation email delivery.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T010 [P] [US2] Write Vitest unit tests in `tests/unit/smtp.test.ts` for the new `sendBookingCancelledEmail` SMTP helper function
- [ ] T011 [US2] Write failing Vitest unit tests in `tests/unit/booking-dashboard.test.ts` to mock SMTP and assert that `sendBookingCancelledEmail` is called when a booking status transitions to "Cancelled" via `updateBookingStatusAction`

### Implementation for User Story 2

- [ ] T012 [P] [US2] Implement `sendBookingCancelledEmail` SMTP helper function in `src/lib/mail/smtp.ts` using Nodemailer
- [ ] T013 [US2] Update `updateBookingStatusAction` in `src/app/admin/bookings/actions.ts` to trigger `sendBookingCancelledEmail` asynchronously on "Cancelled" status transitions

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T014 [P] Code cleanup, type verification, and running `npm run lint`
- [ ] T015 Run quickstart.md validation to verify end-to-end flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Services/utilities before actions/endpoints
- Core implementation before integration
- Story complete before moving to next priority

---

## Parallel Example: User Story 1

```bash
# Write Vitest tests for smtp and dashboard actions in parallel:
Task: "Write Vitest unit tests in tests/unit/smtp.test.ts for the new sendBookingConfirmedEmail SMTP helper function"
Task: "Write failing Vitest unit tests in tests/unit/booking-dashboard.test.ts to mock SMTP and assert that sendBookingConfirmedEmail is called when a booking status transitions to Confirmed"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Run validation checks
