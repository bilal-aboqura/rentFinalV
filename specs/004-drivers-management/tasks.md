# Tasks: Drivers Management

**Input**: Design documents from `/specs/004-drivers-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database seeding

- [ ] T001 Run the PostgreSQL DDL Script defined in data-model.md to create the drivers table and check constraints in the Supabase SQL editor
- [ ] T002 Create the validation schema file at src/lib/validation/driver.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation schemas and testing infrastructure

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Write Vitest unit tests in tests/unit/driver.test.ts to validate CreateDriverSchema and UpdateDriverSchema, name length constraints, phone normalization, and availability status constraints
- [ ] T004 Implement CreateDriverSchema and UpdateDriverSchema in src/lib/validation/driver.ts to make the tests in tests/unit/driver.test.ts pass

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Drivers List View, Search, and Pagination (Priority: P1) 🎯 MVP

**Goal**: Retrieve and display a paginated list of drivers with server-side search by name or phone.

**Independent Test**: Navigate to /admin/drivers, verify the table loads, verify that searching for names/phones filters results, and check that pagination controls function.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T005 [P] [US1] Write unit tests in tests/unit/driver-fetch.test.ts for database fetching, search filtering (case-insensitive name/phone), and pagination options

### Implementation for User Story 1

- [ ] T006 [US1] Create the Server Component page at src/app/admin/drivers/page.tsx to fetch drivers from Supabase, applying search query parameters and limit/offset pagination parameters
- [ ] T007 [P] [US1] Build the UI components (search input, paginated table list, and colored status badges) using Tailwind CSS inside src/app/admin/drivers/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP ready!)

---

## Phase 4: User Story 2 - Add New Driver (Priority: P1)

**Goal**: Register a new driver with their name, unique phone number, and status.

**Independent Test**: Click "Add Driver", submit invalid inputs to see field validation, submit duplicate phone number to verify uniqueness handling, and submit valid info to check successful insertion.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T008 [P] [US2] Write unit tests in tests/unit/driver-create.test.ts to verify createDriverAction server action input validation and uniqueness error parsing

### Implementation for User Story 2

- [ ] T009 [US2] Implement the Server Action createDriverAction in src/app/admin/drivers/actions.ts to validate inputs with CreateDriverSchema, insert records into Supabase, catch PostgreSQL unique constraint violations, and return structured error messages
- [ ] T010 [P] [US2] Create the Client Component form at src/components/driver-form.tsx to handle field states, client-side validation, loading states, and displaying server validation errors
- [ ] T011 [US2] Integrate the Add Driver modal and form trigger button into src/app/admin/drivers/page.tsx

**Checkpoint**: At this point, User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Edit Existing Driver (Priority: P2)

**Goal**: Modify an existing driver's details (name, phone, status).

**Independent Test**: Click "Edit" on a driver row, change details, submit, and confirm that the details update in the list and unique constraints block duplicates.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T012 [P] [US3] Write unit tests in tests/unit/driver-update.test.ts to verify updateDriverAction server action updates, validations, and database constraints

### Implementation for User Story 3

- [ ] T013 [US3] Implement the Server Action updateDriverAction in src/app/admin/drivers/actions.ts to validate inputs with UpdateDriverSchema, update database records, and return structured success/error responses
- [ ] T014 [US3] Update the driver-form.tsx component at src/components/driver-form.tsx to support edit mode (pre-populating values, switching submit target to updateDriverAction)
- [ ] T015 [US3] Add the Edit modal trigger in the action columns of the drivers table at src/app/admin/drivers/page.tsx

**Checkpoint**: At this point, User Stories 1, 2, and 3 should all be fully functional

---

## Phase 6: User Story 4 - Delete Driver (Priority: P3)

**Goal**: Delete a driver record from the fleet roster.

**Independent Test**: Click "Delete" on a driver row, click "Confirm" in the dialog, and verify that the driver is removed from the database and UI table.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T016 [P] [US4] Write unit tests in tests/unit/driver-delete.test.ts to verify deleteDriverAction server action behaves correctly under success and not found scenarios

### Implementation for User Story 4

- [ ] T017 [US4] Implement the Server Action deleteDriverAction in src/app/admin/drivers/actions.ts to delete a driver by ID and return success/error responses
- [ ] T018 [US4] Add a delete action button with a confirmation dialog to each driver row in the table at src/app/admin/drivers/page.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Run quickstart.md validation scenarios to perform manual verification of all features
- [ ] T020 [P] Run the entire Vitest test suite via npm run test to verify all tests pass and check build correctness
- [ ] T021 [P] Format files and resolve any TypeScript or ESLint compile warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - Stories must be completed in sequential priority order (US1 → US2 → US3 → US4)
- **Polish (Phase 7)**: Depends on all user stories being complete

---

## Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- Once Foundational phase is complete, frontend UI layout tasks and backend Server Action tests can be developed in parallel

---

## Parallel Example: User Story 1

```bash
# Developer A writes backend fetch tests
Task: "T005 [P] [US1] Write unit tests in tests/unit/driver-fetch.test.ts for database fetching..."

# Developer B starts frontend layout
Task: "T007 [P] [US1] Build the UI components (search input, table list, badges) using Tailwind..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently in browser and via tests
5. Commit progress

### Incremental Delivery

1. Add User Story 2 -> Test and verify creation
2. Add User Story 3 -> Test and verify modification
3. Add User Story 4 -> Test and verify deletion
4. Run full suite and polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
