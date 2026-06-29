# Tasks: Airport Transfer and Driver Booking System

**Input**: Design documents from `/specs/001-airport-transfer-booking/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/actions.md

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic workspace structure

- [ ] T001 Initialize Next.js project and configure tailwindcss, lucide-react, zod, and typescript dependencies in package.json
- [ ] T002 Configure TypeScript compile rules in tsconfig.json
- [ ] T003 Configure Vitest testing environments in vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database connections, environment configs, and Supabase integrations

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create Supabase client and server configuration helpers in src/lib/supabase/client.ts and src/lib/supabase/server.ts
- [ ] T005 Write PostgreSQL migrations for locations, drivers, pricing_rules, bookings, content, and notifications tables with RLS policies in supabase/migrations/20260623000000_init_schema.sql
- [ ] T006 Define TS Types for all entities in src/types/index.ts
- [ ] T007 Define Zod validation schemas for booking, contact, driver, and pricing validation in src/lib/validation/schema.ts
- [ ] T008 Setup Nodemailer SMTP email configuration utility in src/lib/email/nodemailer.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Customer Ride Booking (Priority: P1) 🎯 MVP

**Goal**: Customer can query pricing estimates, select vehicles, and submit booking requests.

**Independent Test**: Users can access booking page, select routes, view estimates, and submit, resulting in a database pending record.

### Tests for User Story 1 (MANDATORY) ⚠️
- [ ] T009 [US1] Write failing Vitest unit tests for booking form validation and submit states in tests/unit/components.test.ts
- [ ] T010 [US1] Write failing Vitest integration tests for booking creation and pricing calculation in tests/integration/actions.test.ts

### Implementation for User Story 1
- [ ] T011 [US1] Implement Server Action to fetch active locations in src/app/(customer)/actions.ts
- [ ] T012 [US1] Implement Server Action to query route pricing rules in src/app/(customer)/actions.ts
- [ ] T013 [US1] Implement Server Action to create booking request with future-date validation in src/app/(customer)/actions.ts
- [ ] T014 [US1] Create responsive booking wizard form component styled with Tailwind CSS in src/components/booking-form.tsx
- [ ] T015 [US1] Create main customer landing page view integrating the booking form in src/app/(customer)/page.tsx
- [ ] T016 [US1] Implement Server Action for guest contact message submission in src/app/(customer)/actions.ts
- [ ] T017 [US1] Create contact page with form in src/app/(customer)/contact/page.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Admin Booking Management (Priority: P1)

**Goal**: Authenticate admins and allow them to search/filter bookings and change their status.

**Independent Test**: Only authenticated users can access `/admin/*` routes; admins can transition booking status to confirmed.

### Tests for User Story 2 (MANDATORY) ⚠️
- [ ] T018 [US2] Write failing Vitest integration tests for admin auth checking, bookings retrieval, and status changes in tests/integration/actions.test.ts

### Implementation for User Story 2
- [ ] T019 [US2] Setup Supabase authentication helpers and routes in src/app/admin/login/page.tsx and Server Action in src/app/admin/dashboard/actions.ts
- [ ] T020 [US2] Create middleware to protect dashboard routes (`/admin/dashboard/*`) in src/middleware.ts
- [ ] T021 [US2] Implement Server Action to fetch bookings with search, pagination, and status filters in src/app/admin/dashboard/actions.ts
- [ ] T022 [US2] Implement Server Action to update booking status in src/app/admin/dashboard/actions.ts
- [ ] T023 [US2] Create dashboard layout with responsive sidebar in src/app/admin/dashboard/layout.tsx
- [ ] T024 [US2] Create bookings listing and management dashboard in src/app/admin/dashboard/bookings/page.tsx

**Checkpoint**: User Stories 1 and 2 are fully functional and secure.

---

## Phase 5: User Story 3 - Admin Drivers, Pricing & Settings Management (Priority: P2)

**Goal**: Admins can manage driver profiles, pricing rules, cities, and assign drivers safely.

**Independent Test**: Admin can assign an active driver, and system blocks assignment if there's an overlapping schedule.

### Tests for User Story 3 (MANDATORY) ⚠️
- [ ] T025 [US3] Write failing Vitest integration tests for driver assignment conflict validation (3-hour overlap check) and settings CRUD Server Actions in tests/integration/actions.test.ts

### Implementation for User Story 3
- [ ] T026 [US3] Implement CRUD Server Actions for drivers, locations, and pricing rules in src/app/admin/dashboard/actions.ts
- [ ] T027 [US3] Implement driver assignment logic with 3-hour overlap validation checks in src/app/admin/dashboard/actions.ts
- [ ] T028 [US3] Create driver profile management page in src/app/admin/dashboard/drivers/page.tsx
- [ ] T029 [US3] Create cities, airports, and pricing rules settings page in src/app/admin/dashboard/settings/page.tsx

**Checkpoint**: Admins can manage active settings and dispatch drivers with schedule safety.

---

## Phase 6: User Story 4 - Automated System Notifications (Priority: P2)

**Goal**: Trigger admin logs on new bookings and send SMTP customer transactional email on status changes.

**Independent Test**: Booking updates send real-time mail simulation to SMTP trap; new bookings trigger dashboard logs.

### Tests for User Story 4 (MANDATORY) ⚠️
- [ ] T030 [US4] Write failing Vitest unit tests for Nodemailer SMTP email dispatches and notification database logs in tests/unit/email.test.ts

### Implementation for User Story 4
- [ ] T031 [US4] Integrate Nodemailer utility to dispatch customer status updates inside booking status change Server Actions
- [ ] T032 [US4] Create Server Action to create database notifications on booking events in src/app/admin/dashboard/actions.ts
- [ ] T033 [US4] Implement admin notifications dashboard widget and unread alerts counter in src/components/notifications-list.tsx

**Checkpoint**: Event-driven notification system is live and verified.

---

## Phase 7: User Story 5 - Admin Content Management (Priority: P3)

**Goal**: Dynamic management of homepage content and FAQ section.

**Independent Test**: Modifying FAQ in admin panel renders immediately on public customer index page.

### Tests for User Story 5 (MANDATORY) ⚠️
- [ ] T034 [US5] Write failing Vitest tests for dynamic page content CRUD in tests/integration/actions.test.ts

### Implementation for User Story 5
- [ ] T035 [US5] Implement dynamic content update Server Action in src/app/admin/dashboard/actions.ts
- [ ] T036 [US5] Create admin content and FAQ customization screen in src/app/admin/dashboard/content/page.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: System optimizations, documentation, and final deployment setup

- [ ] T037 Document environment configuration setup and deployment instructions in README.md
- [ ] T038 Run final Vitest test runner suites and validate quickstart.md guidelines end-to-end
