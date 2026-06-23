# Tasks: Cities & Airports Management

**Input**: Design documents from `/specs/002-locations-management/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/actions.md

**Tests**: Vitest tests are MANDATORY and must be written first, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize Next.js App Router project with TypeScript and Tailwind CSS in the repository root
- [x] T003 [P] Configure ESLint and formatting tools in the project root
- [x] T004 [P] Configure Vitest and setup testing environment in package.json and vite.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Setup Supabase database schema by running migrations/SQL scripts to create `locations` table in Supabase SQL editor
- [x] T006 [P] Configure Row Level Security (RLS) policies for the `locations` table in Supabase SQL editor
- [x] T007 [P] Create Supabase server client and client-side setup in src/lib/supabase/server.ts and src/lib/supabase/client.ts
- [x] T008 [P] Create Zod schemas and validation utilities for Locations in src/lib/validation/location.ts
- [x] T009 Write Vitest unit tests for validation utilities in tests/unit/validation.test.ts
- [x] T010 Verify foundational validation tests pass by running npm run test

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Locations List View with Search & Pagination (Priority: P1) 🎯 MVP

**Goal**: Display all locations in a paginated list view with search capabilities for administrators.

**Independent Test**: Verify list loading, pagination navigation, and case-insensitive searching by mock-fetching data.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Write unit/integration tests using Vitest for fetching and searching locations in tests/unit/fetchLocations.test.ts

### Implementation for User Story 1

- [ ] T012 [US1] Implement server-side fetching function with search and pagination filters in src/app/admin/locations/data.ts
- [ ] T013 [P] [US1] Create Table and Pagination UI elements using Tailwind CSS in src/components/ui/table.tsx
- [ ] T014 [US1] Build Admin Locations Page component using RSC to render list view in src/app/admin/locations/page.tsx
- [ ] T015 [US1] Verify T011 tests pass and manually check locations table rendering in the browser

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 5 - Fetch Active Locations for Dropdowns (Priority: P1)

**Goal**: Expose active locations grouped by Type and sorted alphabetically for the customer booking wizard dropdowns.

**Independent Test**: Verify that customer-facing fetch returns only active locations organized in optgroups.

### Tests for User Story 5 (MANDATORY) ⚠️

- [ ] T016 [P] [US5] Write Vitest tests for active locations grouping and filtering utilities in tests/unit/groupLocations.test.ts

### Implementation for User Story 5

- [ ] T017 [US5] Create utility function to group active locations by type and sort alphabetically in src/lib/utils/groupLocations.ts
- [ ] T018 [US5] Implement customer locations fetch function in src/lib/api/customerLocations.ts
- [ ] T019 [US5] Create customer-facing Booking Wizard view with grouped active location dropdowns in src/components/booking-wizard.tsx
- [ ] T020 [US5] Verify T016 tests pass and manually validate dropdown grouping in the browser

**Checkpoint**: Customer locations are retrieved and properly displayed in dropdowns.

---

## Phase 5: User Story 2 - Define / Create New Location (Priority: P2)

**Goal**: Admin form to add new locations with type/status and uniqueness validation.

**Independent Test**: Verify adding a valid location appears in the table, and duplicate/invalid names are blocked.

### Tests for User Story 2 (MANDATORY) ⚠️

- [ ] T021 [P] [US2] Write Vitest integration tests for Create Location action in tests/integration/createLocation.test.ts

### Implementation for User Story 2

- [ ] T022 [US2] Implement createLocationAction Server Action with Zod validation in src/app/admin/locations/actions.ts
- [ ] T023 [P] [US2] Create Add Location form modal using Tailwind CSS in src/components/location-form.tsx
- [ ] T024 [US2] Integrate Location Form modal with createLocationAction in src/app/admin/locations/page.tsx
- [ ] T025 [US2] Verify T021 tests pass and manually test location creation

**Checkpoint**: Admin can successfully add new locations with validations.

---

## Phase 6: User Story 3 - Modify / Edit Existing Location (Priority: P2)

**Goal**: Admin form to edit an existing location's fields with validation.

**Independent Test**: Verify modifying attributes updates the table, and cancels do not persist.

### Tests for User Story 3 (MANDATORY) ⚠️

- [ ] T026 [P] [US3] Write Vitest integration tests for Update Location action in tests/integration/updateLocation.test.ts

### Implementation for User Story 3

- [ ] T027 [US3] Implement updateLocationAction Server Action in src/app/admin/locations/actions.ts
- [ ] T028 [US3] Connect Edit modal form with updateLocationAction in src/app/admin/locations/page.tsx
- [ ] T029 [US3] Verify T026 tests pass and manually test location updates

**Checkpoint**: Admin can successfully edit existing locations.

---

## Phase 7: User Story 4 - Delete Location (Priority: P3)

**Goal**: Delete a location, restricting it if referenced by bookings or pricing rules.

**Independent Test**: Verify deleting an unused location removes it, and deleting a referenced location is blocked.

### Tests for User Story 4 (MANDATORY) ⚠️

- [ ] T030 [P] [US4] Write Vitest integration tests for Delete Location action (handling blocks for referenced bookings) in tests/integration/deleteLocation.test.ts

### Implementation for User Story 4

- [ ] T031 [US4] Implement deleteLocationAction Server Action checking for booking references in src/app/admin/locations/actions.ts
- [ ] T032 [US4] Add Delete button and confirmation modal to Admin table in src/app/admin/locations/page.tsx
- [ ] T033 [US4] Verify T030 tests pass and manually test location deletion

**Checkpoint**: Admin can delete locations safely with referential integrity blocks.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T034 [P] Document features and APIs in README.md
- [ ] T035 Perform final code cleanup and CSS layout refinement using Tailwind
- [ ] T036 Run quickstart.md validation scenario tests and log results in specs/002-locations-management/walkthrough.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US5 → US2 → US3 → US4)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (US1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (US5)**: Can start after Foundational (Phase 2) - Retrieves active locations, independent from admin forms
- **User Story 2 (US2)**: Can start after US1 - Adds locations to the admin dashboard list
- **User Story 3 (US3)**: Can start after US2 - Edits existing locations
- **User Story 4 (US4)**: Can start after US3 - Deletes existing locations

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core database fetching/mutations before UI components
- Integrations and layout updates after core logic

### Parallel Opportunities

- Setup tasks (T003, T004) can run in parallel.
- Foundational tasks (T006, T007, T008) can run in parallel.
- Integration tests/contract tests for different user stories can be developed in parallel once foundational models are defined.

---

## Parallel Example: User Story 1

```bash
# Launch validation utility tests:
Task: "Write Vitest unit tests for validation utilities in tests/unit/validation.test.ts"
Task: "Write unit/integration tests using Vitest for fetching and searching locations in tests/unit/fetchLocations.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 5 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Admin view)
4. Complete Phase 4: User Story 5 (Customer view)
5. **STOP and VALIDATE**: Verify end-to-end read-only locations management.

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 & 5 -> Test independently -> Deliver read-only flows
3. Add User Story 2 -> Test independently -> Deliver creation capabilities
4. Add User Story 3 & 4 -> Test independently -> Deliver full CRUD management
