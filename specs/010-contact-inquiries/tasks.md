# Tasks: Contact Form & Inquiries Management

**Input**: Design documents from `/specs/010-contact-inquiries/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/server-actions.md

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema creation and migration execution.

- [x] T001 Create database schema migration SQL script in supabase/migrations/20260626000002_create_contact_inquiries.sql
- [x] T002 Apply database migration to local/Supabase instance

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Common validation rules and types used across public and admin sections.

- [x] T003 Write failing Zod validation schema unit tests in tests/unit/contact-validation.test.ts
- [x] T004 Create Zod validation schema in src/lib/validation/contact.ts and verify tests pass

---

## Phase 3: User Story 1 - Submit Contact Inquiry (Priority: P1) 🎯 MVP

**Goal**: Allow visitors to submit contact messages at `/contact` and persist them to the database.

**Independent Test**: Navigate to `/contact`, fill and submit a valid inquiry, and verify that it is saved to the database.

### Tests for User Story 1 (MANDATORY) ⚠️

- [x] T005 [P] [US1] Write failing unit tests for submitContactForm server action in tests/unit/contact-actions.test.ts

### Implementation for User Story 1

- [x] T006 [US1] Implement submitContactForm Server Action in src/app/actions/contact.ts
- [x] T007 [US1] Verify submitContactForm unit tests pass by running npx vitest
- [x] T008 [P] [US1] Create the responsive public contact form page UI in src/app/contact/page.tsx
- [x] T009 [US1] Integrate submitContactForm Action with the contact form client component in src/app/contact/page.tsx

**Checkpoint**: At this point, User Story 1 (customer UI and persistence) is fully functional and testable.

---

## Phase 4: User Story 2 - Admin View Inquiries List (Priority: P1)

**Goal**: Allow admins to view all contact inquiries sorted newest first with pagination.

**Independent Test**: Navigate to `/admin/inquiries` and verify that the page loads a paginated list of inquiries in reverse chronological order.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T010 [P] [US2] Write failing unit tests for fetchInquiriesAction server action in tests/unit/contact-actions.test.ts

### Implementation for User Story 2

- [x] T011 [US2] Implement fetchInquiriesAction Server Action in src/app/admin/inquiries/actions.ts
- [x] T012 [US2] Verify fetchInquiriesAction unit tests pass
- [x] T013 [US2] Create admin inquiries dashboard page UI with pagination in src/app/admin/inquiries/page.tsx

**Checkpoint**: At this point, the admin inquiries table and page routing are functional.

---

## Phase 5: User Story 3 - Admin Manage Inquiry (Priority: P2)

**Goal**: Allow admins to read full inquiry details in a modal and update the status.

**Independent Test**: Click an inquiry row, view details modal, change status, and verify status updates in list and database.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T014 [P] [US3] Write failing unit tests for updateInquiryStatusAction server action in tests/unit/contact-actions.test.ts

### Implementation for User Story 3

- [x] T015 [US3] Implement updateInquiryStatusAction Server Action in src/app/admin/inquiries/actions.ts
- [x] T016 [US3] Verify updateInquiryStatusAction unit tests pass
- [x] T017 [US3] Create details modal and status dropdown UI in src/app/admin/inquiries/page.tsx
- [x] T018 [US3] Integrate details modal and status actions with the table view in src/app/admin/inquiries/page.tsx

**Checkpoint**: Admin details modal and status management are fully functional.

---

## Phase 6: User Story 4 - Admin Navbar Unread Indicator (Priority: P2)

**Goal**: Display an unread count badge next to the Inquiries tab in the AdminNavbar.

**Independent Test**: Submit a new inquiry and verify that the unread badge increments/appears on the admin navbar.

### Tests for User Story 4 (MANDATORY) ⚠️

- [x] T019 [P] [US4] Write failing unit tests for getUnreadInquiriesCount server action in tests/unit/contact-actions.test.ts

### Implementation for User Story 4

- [x] T020 [US4] Implement getUnreadInquiriesCount Server Action in src/app/admin/inquiries/actions.ts
- [x] T021 [US4] Verify getUnreadInquiriesCount unit tests pass
- [x] T022 [US4] Update AdminNavbar component in src/components/admin-navbar.tsx to fetch and display the badge count

**Checkpoint**: The unread inquiries badge is fully integrated into the global admin navigation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: General cleanup, full test coverage validation, and manual verification.

- [x] T023 Run Vitest test suite to ensure all unit tests (locations, pricing, drivers, bookings, contacts) pass
- [x] T024 Manually verify all contact scenarios on localhost per quickstart.md
- [x] T025 Run ESLint and TypeScript compiler type-check to verify build readiness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
  - User Story 1 (P1) is the MVP and is worked on first.
  - User Story 2 (P1) can proceed after User Story 1 backend is set up, or in parallel.
  - User Story 3 (P2) depends on User Story 2 UI.
  - User Story 4 (P2) depends on User Story 3 status update functionality.
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- T004, T005, T008, T010, T014, and T019 can be prepared in parallel as they touch different files (tests vs. source).
- Once the schema is set up, tests and schemas can be developed concurrently.
