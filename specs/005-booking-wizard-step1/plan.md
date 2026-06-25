# Implementation Plan: Booking Wizard (Step 1: Route & Time)

**Branch**: `005-booking-wizard-step1` | **Date**: 2026-06-26 | **Spec**: [specs/005-booking-wizard-step1/spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/005-booking-wizard-step1/spec.md)

**Input**: Feature specification from `/specs/005-booking-wizard-step1/spec.md`

## Summary

The Booking Wizard (Step 1: Route & Time) allows customer-facing web application users to initiate a booking by selecting their pickup and destination locations, date, and time. 

The technical approach will leverage Next.js App Router Client Components for interactive form state and Server Actions for data queries and secure validations. The UI will be built with Tailwind CSS, utilizing `lucide-react` for standard icons, and verified with a Vitest test suite. Timezone-safe validations for same-day bookings with a 2-hour lead time will be evaluated on the server using Node.js's local operational timezone as the single source of truth.

## Technical Context

**Language/Version**: TypeScript (v5+), Node.js (v18+)

**Primary Dependencies**: Next.js (v16+), React (v19+), `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`, `tailwindcss`

**Storage**: PostgreSQL (via Supabase)

**Testing**: Vitest (v4.1.9)

**Target Platform**: Vercel or any Node.js production hosting environment

**Project Type**: Web application (Next.js App Router)

**Performance Goals**:
- Component rendering and client transitions happen in under 100ms.
- Server-side route pricing queries return responses in under 500ms.

**Constraints**:
- Single Next.js application structure.
- No external state-management or router libraries allowed.
- Server's timezone used for secure 2-hour same-day buffer check.

**Scale/Scope**: Transient in-memory booking parameters serving public booking visitors.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Log
- **Principle I: Clean and Modular Code** -> **PASS**. Wizard will be split into a parent container managing state transitions and step components.
- **Principle II: Strict TypeScript & Next.js App Router Best Practices** -> **PASS**. Full type-safety on booking state and Server Actions.
- **Principle III: Secure Server-Side Operations & Supabase Integration** -> **PASS**. Reuses database schema and reads tables securely via Server Actions. Timezone validation is executed securely on the server.
- **Principle IV: Test-Driven Development (TDD) with Vitest** -> **PASS**. Tests for timezone logic, same-day buffers, and state validations will be run first.
- **Principle V: Responsive, Mobile-First Tailwind UI** -> **PASS**. UI styled with standard Tailwind CSS.
- **Tech Stack Constraints** -> **PASS**. Next.js App Router, React State, Supabase, Tailwind, Vitest.

## Project Structure

### Documentation (this feature)

```text
specs/005-booking-wizard-step1/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database & state design
├── quickstart.md        # Phase 1 validation instructions
├── contracts/
│   └── actions.md       # Phase 1 Server Actions contracts
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── actions/
│   │   └── booking.ts            # Booking server actions & validation logic (NEW)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── booking-wizard.tsx        # Parent component managing multi-step state (MODIFY)
│   └── booking-wizard-step1.tsx  # Step 1 component (NEW)
├── lib/
│   ├── api/
│   │   └── customerLocations.ts  # Location fetch server action (REUSED)
│   └── validation/
│       └── booking.ts            # Zod validation schemas for booking (NEW)
tests/
└── unit/
    └── booking.test.ts           # Vitest validation tests (NEW)
```

**Structure Decision**: Single Next.js project layout utilizing the `src/` directory. Next.js App Router is used for layouts and page routes. Transient multi-step booking state is passed via component props from the parent `BookingWizard` to children, keeping routes clean.

## Complexity Tracking

*No violations of the Constitution identified; this plan is 100% compliant with the core technology stack and principles.*

---

## Verification Plan

### Automated Tests
- Run Vitest validation tests:
  ```bash
  npx vitest tests/unit/booking.test.ts
  ```

### Manual Verification
1. Launch the local dev server:
   ```bash
   npm run dev
   ```
2. Verify all scenarios detailed in [quickstart.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/005-booking-wizard-step1/quickstart.md):
   - Loading active, grouped locations in dropdowns.
   - Same-location selection prevention.
   - Dynamic price query and display.
   - Redirection to `/contact` for unpriced routes.
   - Disabling past dates in the date picker.
   - Enforcing the 2-hour same-day booking lead-time buffer.
