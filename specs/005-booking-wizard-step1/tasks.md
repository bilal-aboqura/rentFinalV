# Tasks: Booking Wizard (Step 1: Route & Time)

**Input**: Design documents from `/specs/005-booking-wizard-step1/`

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

- [x] T001 Initialize Vitest tests for the booking wizard component and state logic in tests/unit/booking.test.ts
- [x] T002 [P] Create initial Zod schemas file structure in src/lib/validation/booking.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Implement Zod schemas for Step 1 input validation in src/lib/validation/booking.ts
- [x] T004 [P] Implement timezone-safe same-day schedule validation helper function in src/app/actions/booking.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Route Selection and Validation (Priority: P1) 🎯 MVP

**Goal**: Allow customers to select distinct active locations, group by type, sort alphabetically, and prevent selecting identical locations.

**Independent Test**: Customer opens the homepage, selects origin and destination. Dropdowns display active locations sorted alphabetically under "Cities", "Airports", and "Pickup Points". Selecting the same location displays a validation warning: "Pickup and destination locations must be different." and prevents proceeding.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Write unit tests for same-location validation constraints and active location dropdown rendering logic in tests/unit/booking.test.ts

### Implementation for User Story 1

- [x] T006 [US1] Implement base BookingWizardStep1 component rendering pickup and destination dropdowns in src/components/booking-wizard-step1.tsx
- [x] T007 [US1] Integrate active location fetching via fetchActiveLocationsAction and layout grouping via groupLocationsByType in src/components/booking-wizard-step1.tsx
- [x] T008 [US1] Add frontend check to block same-location selections and display validation errors in src/components/booking-wizard-step1.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Dynamic Pricing Lookup (Priority: P2)

**Goal**: Dynamically retrieve price for selected distinct locations; disable "Next" button and redirect to /contact if no price is configured.

**Independent Test**: Select Austin Airport and Austin Downtown. The price ($75.00) is retrieved and displayed. Select a route with no price. Next is disabled, and contact form redirect link is displayed. Clicking it redirects to /contact.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T009 [P] [US2] Write unit tests for dynamic pricing lookups, price displaying, and contact redirect logic in tests/unit/booking.test.ts

### Implementation for User Story 2

- [x] T010 [US2] Implement dynamic getRoutePriceAction lookup inside BookingWizardStep1 when valid distinct locations are selected in src/components/booking-wizard-step1.tsx
- [x] T011 [US2] Add loading spinner state and display route price once retrieved in src/components/booking-wizard-step1.tsx
- [x] T012 [US2] Add fallback UI handling unpriced routes by disabling the Next button and showing /contact redirect link in src/components/booking-wizard-step1.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Schedule and Buffer Selection (Priority: P3)

**Goal**: Select date and time, disable past dates in picker, and validate same-day bookings against the 2-hour lead time buffer using server timezone.

**Independent Test**: Date picker does not allow selecting past dates. For same-day dates, picking a time within 2 hours of current server time displays an error: "Bookings must be made at least 2 hours in advance." and disables proceeding.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T013 [P] [US3] Write unit tests for same-day 2-hour lead-time buffer checking logic in tests/unit/booking.test.ts

### Implementation for User Story 3

- [x] T014 [US3] Implement server-side action validateBookingScheduleAction that verifies the lead-time buffer in src/app/actions/booking.ts
- [x] T015 [US3] Add date and time input fields to BookingWizardStep1 component with client-side min-date restriction in src/components/booking-wizard-step1.tsx
- [x] T016 [US3] Integrate the validateBookingScheduleAction call into the component step submission logic to validate lead time before letting users proceed in src/components/booking-wizard-step1.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T017 [P] Refactor the parent BookingWizard to store step 1 state, orchestrate components, and transition to step 2 in src/components/booking-wizard.tsx
- [x] T018 Apply responsive, mobile-first styling check and clean up styling classes in src/components/booking-wizard-step1.tsx
- [x] T019 Run quickstart.md validation and ensure all tests pass cleanly in tests/unit/booking.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write unit tests for same-location validation constraints and active location dropdown rendering logic in tests/unit/booking.test.ts"
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
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
