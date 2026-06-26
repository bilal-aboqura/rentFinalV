# Tasks: Content Management System (CMS)

**Input**: Design documents from `/specs/011-content-management-system/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and bucket initialization.

- [x] T001 Create Supabase migration file `supabase/migrations/20260626000003_create_site_settings.sql` to define the `site_settings` table, single-row constraint, and default color scheme values.
- [x] T002 Configure the public Supabase Storage bucket `public_assets` and its RLS policies in `supabase/migrations/20260626000003_create_site_settings.sql`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model types and database migration execution.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Define TypeScript interfaces for `SiteSettings` and `UpdateSiteSettingsInput` in `src/types/index.ts`.
- [x] T004 Run the local database migration to create the settings table and storage bucket structures.

---

## Phase 3: User Story 1 - Admin Configures Branding and Text Settings (Priority: P1) 🎯 MVP

**Goal**: Allow administrators to view and edit textual settings and theme colors on the admin content page.

**Independent Test**: Retrieve settings dynamically, update settings with new values, and verify the changes are saved to the database.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Write Vitest unit tests in `tests/unit/cms-actions.test.ts` for the `getSiteSettings` and `updateSiteSettings` Server Actions.
- [x] T006 [P] [US1] Write input validation unit tests in `tests/unit/cms-actions.test.ts` to ensure invalid emails and empty text fields are rejected.

### Implementation for User Story 1

- [x] T007 [US1] Implement the `getSiteSettings` and `updateSiteSettings` Server Actions in `src/app/actions/cms.ts`.
- [x] T008 [US1] Create the admin content page at `src/app/admin/content/page.tsx` featuring standard forms, color pickers, and status states (saving, success, error).
- [x] T009 [US1] Add a link to the `/admin/content` page in the admin navigation layout (e.g. in sidebar/navigation components).

---

## Phase 4: User Story 2 - Admin Uploads Branding and Hero Images (Priority: P2)

**Goal**: Allow administrators to upload visual image assets to the storage bucket and link them to the settings.

**Independent Test**: Upload an image to the bucket, verify it returns a public URL, and updates the settings table.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T010 [P] [US2] Write Vitest unit tests in `tests/unit/cms-actions.test.ts` for the `uploadSiteAsset` Server Action.

### Implementation for User Story 2

- [x] T011 [US2] Implement the `uploadSiteAsset` Server Action in `src/app/actions/cms.ts` to upload images to the storage bucket and save URLs to the table.
- [x] T012 [US2] Add file upload inputs and preview elements for Site Logo and Hero Background in `src/app/admin/content/page.tsx`.

---

## Phase 5: User Story 3 - Customer Experiences Dynamic Content (Priority: P3)

**Goal**: Load the branding colors, logos, and custom texts dynamically on the customer pages.

**Independent Test**: Load the public page and verify that custom colors are applied and settings are dynamically populated.

### Implementation for User Story 3

- [x] T013 [US3] Integrate dynamic brand colors in `src/app/layout.tsx` to dynamically apply configured primary and secondary color styles.
- [x] T014 [US3] Update the homepage in `src/app/page.tsx` to fetch settings dynamically using `getSiteSettings` and render the hero title and background image.
- [x] T015 [US3] Update the footer component to dynamically display contact phone and email settings.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and final cleanup.

- [x] T016 Run all tests using `npx vitest run tests/unit/cms-actions.test.ts` and verify they pass.
- [x] T017 Refactor any duplicated code, optimize image rendering, and handle edge cases (e.g., database offline fallbacks).
- [x] T018 Run the `quickstart.md` validation scenario to ensure the feature is fully complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **User Stories (Phases 3-5)**: Depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all user stories completion.

### Parallel Opportunities

- Migration creation and storage bucket definitions (`T001`, `T002`) can be done in parallel.
- Test suites (`T005`, `T006`, `T010`) can be written in parallel.
