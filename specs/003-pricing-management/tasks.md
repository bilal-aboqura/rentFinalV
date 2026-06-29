# Tasks: Pricing Management

**Input**: Design documents from `/specs/003-pricing-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Setup database schema and constraints for `route_prices` table in Supabase
- [X] T002 Configure local environment variables for Supabase in `.env.local`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Create TypeScript interfaces for RoutePrice in `src/types/index.ts`
- [X] T004 [P] Create validation schemas in `src/lib/validation/pricing.ts`
- [X] T005 [P] Create Vitest validation tests in `tests/unit/pricing.test.ts`
- [X] T006 Run and verify Vitest validation tests pass for `tests/unit/pricing.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Pricing Rules List View (Priority: P1) 🎯 MVP

**Goal**: View a comprehensive list of all defined trip pricing rules in a clean, paginated table format.

**Independent Test**: Navigate to the admin pricing page and verify that the list of routes, prices, and pagination controls loads.

### Tests for User Story 1 (MANDATORY) ⚠️

- [X] T007 [P] [US1] Create Vitest mock tests for fetching route prices in `tests/unit/pricing-fetch.test.ts`

### Implementation for User Story 1

- [X] T008 [US1] Implement Server Action to retrieve paginated route prices with location joins in `src/app/admin/pricing/actions.ts`
- [X] T009 [US1] Create the Admin Pricing page and paginated table view in `src/app/admin/pricing/page.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Define / Create New Pricing Rule (Priority: P2)

**Goal**: Create a new pricing rule for a route (valid active locations and positive price, uniqueness checked).

**Independent Test**: Submit Add Route Price form with valid fields and verify it persists and updates the table.

### Tests for User Story 2 (MANDATORY) ⚠️

- [X] T010 [P] [US2] Create Vitest mock tests for createRoutePriceAction in `tests/unit/pricing-create.test.ts`
- [X] T011 [US2] Implement `createRoutePriceAction` Server Action in `src/app/admin/pricing/actions.ts` with validation and database duplicate error handling
- [X] T012 [US2] Create the Add Route Price modal form component in `src/components/pricing-form.tsx`
- [X] T013 [US2] Integrate the pricing form modal into the admin pricing page at `src/app/admin/pricing/page.tsx`

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Modify / Edit Existing Pricing Rule (Priority: P2)

**Goal**: Update the price or route locations of an existing pricing rule.

**Independent Test**: Edit pricing rule, verify details are updated and displayed.

### Tests for User Story 3 (MANDATORY) ⚠️

- [X] T014 [P] [US3] Create Vitest mock tests for updateRoutePriceAction in `tests/unit/pricing-update.test.ts`
- [X] T015 [US3] Implement `updateRoutePriceAction` Server Action in `src/app/admin/pricing/actions.ts` with validation and duplicate error checking
- [X] T016 [US3] Update the form modal in `src/components/pricing-form.tsx` to support Edit mode and populate with existing data
- [X] T017 [US3] Connect Edit button in `src/app/admin/pricing/page.tsx` to the form modal

**Checkpoint**: At this point, User Stories 1, 2, and 3 should work independently

---

## Phase 6: User Story 4 - Delete Pricing Rule (Priority: P3)

**Goal**: Delete a pricing rule that is no longer offered.

**Independent Test**: Click Delete, confirm deletion, and verify the record is removed from the table.

### Tests for User Story 4 (MANDATORY) ⚠️

- [X] T018 [P] [US4] Create Vitest mock tests for deleteRoutePriceAction in `tests/unit/pricing-delete.test.ts`
- [X] T019 [US4] Implement `deleteRoutePriceAction` Server Action in `src/app/admin/pricing/actions.ts`
- [X] T020 [US4] Bind the Delete action to the Delete button in the table at `src/app/admin/pricing/page.tsx`

**Checkpoint**: All admin pricing CRUD flows should now be functional

---

## Phase 7: User Story 5 - Fetch Trip Price in Booking Wizard (Priority: P1)

**Goal**: Booking wizard (customer-facing) instantly retrieves the trip price for a selected route.

**Independent Test**: Select pickup and destination locations in the wizard, verify that the calculated price is shown instantly or a custom message is shown if no price exists.

### Tests for User Story 5 (MANDATORY) ⚠️

- [X] T021 [P] [US5] Create Vitest tests for customer pricing query utilities in `tests/unit/booking-pricing.test.ts`
- [X] T022 [US5] Implement public route price lookup action or endpoint in `src/app/admin/pricing/actions.ts`
- [X] T023 [US5] Integrate the price lookup in the public booking wizard page/component in `src/components/booking-wizard.tsx`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T024 Documentation updates in `specs/003-pricing-management/`
- [X] T025 Run full Vitest suite to verify 100% of tests pass
- [X] T026 Run the verification scenarios outlined in `specs/003-pricing-management/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)
- **User Story 3 (P3)**: Depends on US2 (pricing-form)
- **User Story 4 (P4)**: Can start after Foundational (Phase 2)
- **User Story 5 (P5)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Foundational tasks marked [P] can run in parallel
- Testing tasks marked [P] can run in parallel
- Once Foundational phase is complete, US1, US2, US4, and US5 can be developed in parallel

---

## Parallel Example: User Story 2

```bash
# Run unit tests and model creations in parallel
Task: "Create Vitest mock tests for createRoutePriceAction in tests/unit/pricing-create.test.ts"
Task: "Create the Add Route Price modal form component in src/components/pricing-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Table list)
4. **STOP and VALIDATE**: Verify page rendering with seeded route prices in database.

### Incremental Delivery

1. Setup + Foundational
2. Add User Story 1 (Read list)
3. Add User Story 2 (Create new)
4. Add User Story 3 (Edit)
5. Add User Story 4 (Delete)
6. Add User Story 5 (Booking lookup)
7. Polish
