# Tasks: Airport Transfer and Driver Booking System

**Input**: Design documents from `/specs/001-airport-transfer-booking/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Tests**: Tests are MANDATORY and must be written first using Vitest, ensuring they fail before implementation, per the project constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic workspace structure

- [x] T001 Create backend and frontend directories in backend/ and frontend/
- [x] T002 Initialize backend project and install express, sequelize, pg, and typescript dependencies in backend/package.json
- [x] T003 Initialize frontend React Vite project and install tailwindcss, react-router-dom, and vitest dependencies in frontend/package.json
- [x] T004 [P] Configure TypeScript compile rules in backend/tsconfig.json and frontend/tsconfig.json
- [x] T005 [P] Configure Vitest test environments in backend/vitest.config.ts and frontend/vite.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database connections, environment configs, and routing setups

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Configure database connection pool in backend/src/config/database.ts
- [x] T007 Create base migrations for Locations, Drivers, Users, PricingRules, Bookings, Content, and Notifications tables in backend/migrations/
- [x] T008 [P] Define database schemas and relationships in backend/src/models/
- [x] T009 [P] Implement env configuration parsing in backend/src/config/env.ts
- [x] T010 Setup Express global logging and error handling middlewares in backend/src/middleware/logger.ts and backend/src/middleware/error.ts
- [x] T011 Create database seed files with initial admin credentials and location mock data in backend/seeders/
- [x] T012 [P] Configure Axios/fetch base client API client wrapper in frontend/src/services/api.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Customer Ride Booking (Priority: P1) 🎯 MVP

**Goal**: Customer can query pricing estimates, select vehicles, and submit booking requests.

**Independent Test**: Users can access booking page, select routes, view estimates, and submit, resulting in a database pending record.

### Tests for User Story 1 (MANDATORY) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [US1] Write failing Vitest integration tests for locations, pricing quote, and booking submissions in backend/tests/integration/booking.test.ts
- [x] T014 [P] [US1] Write failing Vitest unit tests for booking form component validation and submit states in frontend/tests/unit/BookingForm.test.ts

### Implementation for User Story 1

- [x] T015 [US1] Implement location list endpoint and controller in backend/src/routes/location.ts and backend/src/controllers/location.ts
- [x] T016 [US1] Implement price estimate calculation endpoint in backend/src/routes/booking.ts and backend/src/controllers/booking.ts
- [x] T017 [US1] Implement ride booking creation endpoint with future-date validation in backend/src/controllers/booking.ts
- [x] T018 [US1] Create responsive React booking form component styled with Tailwind in frontend/src/components/BookingForm.tsx
- [x] T019 [US1] Create booking page view integrating form and confirmation feedback in frontend/src/pages/Booking.tsx
- [x] T020 [P] [US1] Implement contact message submission endpoint and controller in backend/src/routes/contact.ts and backend/src/controllers/contact.ts
- [x] T021 [P] [US1] Create contact page with message submission actions in frontend/src/pages/Contact.tsx

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Admin Booking Management (Priority: P1)

**Goal**: Authenticate admins and allow them to search/filter bookings and change their status.

**Independent Test**: Only authenticated users can access `/admin/*` routes; admins can transition booking status to confirmed.

### Tests for User Story 2 (MANDATORY) ⚠️

- [x] T022 [P] [US2] Write failing Vitest unit tests for admin auth controller and JWT validation middleware in backend/tests/unit/auth.test.ts
- [x] T023 [P] [US2] Write failing Vitest integration tests for booking query filters, search, and status updates in backend/tests/integration/adminBookings.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Implement admin login, logout, and token parsing in backend/src/routes/auth.ts and backend/src/controllers/auth.ts
- [x] T025 [US2] Implement auth check and JWT validation middleware in backend/src/middleware/auth.ts
- [x] T026 [US2] Implement booking query and status transition endpoints in backend/src/controllers/adminBooking.ts
- [x] T027 [US2] Create admin login screen with JWT cookie credentials management in frontend/src/pages/Login.tsx
- [x] T028 [US2] Create admin dashboard shell with responsive sidebar navigations in frontend/src/components/AdminLayout.tsx
- [x] T029 [US2] Create admin bookings listing page with search/filters and status updates in frontend/src/pages/AdminBookings.tsx

**Checkpoint**: User Stories 1 and 2 are fully functional and secure.

---

## Phase 5: User Story 3 - Admin Drivers, Pricing & Settings Management (Priority: P2)

**Goal**: Admins can manage driver profiles, pricing rules, cities, and assign drivers safely.

**Independent Test**: Admin can assign an active driver, and system blocks assignment if there's an overlapping schedule.

### Tests for User Story 3 (MANDATORY) ⚠️

- [x] T030 [P] [US3] Write failing Vitest integration tests for driver assignment conflict validation (3-hour overlap check) in backend/tests/integration/driverAssignment.test.ts
- [x] T031 [P] [US3] Write failing Vitest integration tests for drivers, locations, and pricing rules CRUD APIs in backend/tests/integration/settingsCrud.test.ts

### Implementation for User Story 3

- [x] T032 [US3] Implement CRUD APIs for drivers, locations, and pricing rules in backend/src/controllers/settings.ts and backend/src/routes/admin.ts
- [x] T033 [US3] Implement driver assignment logic with 3-hour overlap validation in backend/src/controllers/adminBooking.ts
- [x] T034 [US3] Create admin driver CRUD and profile settings page in frontend/src/pages/AdminDrivers.tsx
- [x] T035 [US3] Create admin city/airport location and pricing rule management views in frontend/src/pages/AdminSettings.tsx

**Checkpoint**: Admins can manage active settings and dispatch drivers with schedule safety.

---

## Phase 6: User Story 4 - Automated System Notifications (Priority: P2)

**Goal**: Trigger admin logs on new bookings and send SMTP customer transactional email on status changes.

**Independent Test**: Booking updates send real-time mail simulation to SMTP trap; new bookings trigger dashboard logs.

### Tests for User Story 4 (MANDATORY) ⚠️

- [x] T036 [P] [US4] Write failing Vitest unit tests for SMTP email sending and notification database triggers in backend/tests/unit/notification.test.ts

### Implementation for User Story 4

- [x] T037 [US4] Implement SMTP mail dispatcher helper using Nodemailer in backend/src/services/email.ts
- [x] T038 [US4] Integrate database model hooks or services to write notification logs on booking events in backend/src/services/notification.ts
- [x] T039 [US4] Implement admin notification dropdown list and unread alert count in frontend/src/components/AdminNotifications.tsx and backend/src/controllers/notification.ts

**Checkpoint**: Event-driven notification system is live and verified.

---

## Phase 7: User Story 5 - Admin Content Management (Priority: P3)

**Goal**: Dynamic management of homepage content and FAQ section.

**Independent Test**: Modifying FAQ in admin panel renders immediately on public customer index page.

### Tests for User Story 5 (MANDATORY) ⚠️

- [x] T040 [P] [US5] Write failing Vitest tests for dynamic page content CRUD in backend/tests/integration/content.test.ts

### Implementation for User Story 5

- [x] T041 [US5] Implement content CRUD API controller and route registration in backend/src/controllers/content.ts and backend/src/routes/content.ts
- [x] T042 [US5] Create admin content and FAQ customization screen in frontend/src/pages/AdminContent.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: System optimizations, documentation, and final deployment setup

- [x] T043 [P] Document environment configuration setup and deployment guide in README.md
- [x] T044 Create Nginx configuration files with TLS settings and proxy rules in nginx.conf
- [x] T045 Run final Vitest test runner suites and validate quickstart.md guidelines end-to-end in specs/001-airport-transfer-booking/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1. Blocks all subsequent User Stories.
- **User Stories (Phase 3+)**: All depend on Phase 2.
  - Phase 3 (US1) is the core MVP.
  - Phase 4 (US2) depends on Phase 3 structures.
  - Phase 5 (US3) depends on Phase 4 auth mechanisms.
  - Phase 6 (US4) depends on Phase 3 and 4 event triggers.
  - Phase 7 (US5) is independent but recommended after US2.
- **Polish (Phase 8)**: Depends on all user stories being implemented.

### Parallel Opportunities

- Setup tasks T004 and T005 can run in parallel.
- Foundational tasks T008, T009, and T012 can run in parallel.
- Integration tests T013 and T014 can be written in parallel.
- Admin dashboard pages (T034, T035, T039, T042) can run in parallel once layout T028 is complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (Enables DB & API Routing)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify customer can book a ride, calculate price, and record is saved in database in pending state.

### Incremental Delivery
1. Add User Story 2 → Test secure login and booking state transitions.
2. Add User Story 3 → Verify driver assignments, schedule conflicts, and pricing rule creations.
3. Add User Story 4 → Validate customer email dispatches and admin dashboard alerts.
4. Add User Story 5 → Add FAQ and marketing text customization controls.
5. Deploy static assets and PM2 Node process behind Nginx proxy.
