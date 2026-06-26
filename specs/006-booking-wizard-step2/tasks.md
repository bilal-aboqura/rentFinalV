# Tasks: Trip Details Form & Booking Confirmation (Step 2)

**Input**: Design documents from `/specs/006-booking-wizard-step2/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install nodemailer dependencies in the root project: `npm install nodemailer @types/nodemailer`
- [x] T002 Configure local environment variables for SMTP and test keys in `.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T003 Setup Supabase database migration for the bookings table at `supabase/migrations/20260626000000_create_bookings.sql` including RLS policies (public insert, public select by header reference, admin full CRUD).

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Review Trip Summary & Input Passenger Information (Priority: P1) 🎯 MVP

**Goal**: Display a read-only summary card of the trip parameters and provide a validated passenger details form.

**Independent Test**: Start wizard step 2 with mock pre-selected route. Verify read-only summary card displays details correctly. Fill in correct details and verify validation passes. Verify that entering an invalid E.164 phone or blank required fields triggers correct validation errors.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] [US1] Write Zod schema unit tests for Step 2 and full booking schema validations in `tests/unit/booking-step2.test.ts`

### Implementation for User Story 1

- [x] T005 [P] [US1] Define validation schemas `BookingStep2Schema` and `SubmitBookingSchema` in `src/lib/validation/booking.ts`
- [x] T006 [P] [US1] Create the SMTP transactional email utility `sendBookingConfirmationEmail` in `src/lib/mail/smtp.ts` using nodemailer
- [x] T007 [US1] Create Next.js Client Component `src/components/booking-wizard-step2.tsx` to display order summary and passenger input form with state validations
- [x] T008 [US1] Integrate `booking-wizard-step2.tsx` client component into parent `src/components/booking-wizard.tsx` container

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Booking Persistence & State Reset (Priority: P2)

**Goal**: Save the booking details to the database, perform price validation, clear the wizard state, and return the booking reference.

**Independent Test**: Submit passenger details form with valid inputs. Verify a database record is created in the `bookings` table with status 'Pending' and all correct attributes. Verify that parent wizard step and selected states are cleared.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T009 [P] [US2] Write unit/integration tests for `submitBookingAction` server action to verify price verification and DB insert in `tests/unit/booking-actions.test.ts`

### Implementation for User Story 2

- [x] T010 [US2] Implement the `submitBookingAction` Next.js Server Action in `src/app/actions/booking.ts` (validate schemas, perform price verification against database, insert booking, send SMTP email, return booking reference)
- [x] T011 [US2] Update parent form submission in `src/components/booking-wizard.tsx` to invoke `submitBookingAction` and clear states on success

**Checkpoint**: User Stories 1 and 2 are fully functional.

---

## Phase 5: User Story 3 - Booking Success Confirmation (Priority: P3)

**Goal**: Transition the UI to a success confirmation view showing the unique booking reference.

**Independent Test**: Submit a valid booking request, confirm the wizard transitions to the success screen displaying the returned UUID reference. Confirm that no payment inputs or external payment frameworks are loaded.

### Implementation for User Story 3

- [x] T012 [US3] Implement the success confirmation view and direct lookup query (with header authorization) in `src/components/booking-wizard-step2.tsx`

**Checkpoint**: All user stories are now independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T013 [P] Clean up any typescript compiler warnings and linting errors
- [x] T014 Run full Vitest test suite (`npm test`) and verify all tests pass
- [x] T015 Run validation walkthrough defined in `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User stories can then proceed in parallel or sequentially.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

---

## Parallel Opportunities

- Setup tasks T001, T002 can run in parallel.
- Test tasks T004, T009 can run in parallel.
- Validation definition T005 and email utility T006 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently
3. Add User Story 2 → Test independently
4. Add User Story 3 → Test independently
5. Polish and verify complete walkthrough
