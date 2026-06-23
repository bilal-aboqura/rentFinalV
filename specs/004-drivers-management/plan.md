# Implementation Plan: Drivers Management

**Branch**: `004-drivers-management` | **Date**: 2026-06-23 | **Spec**: [specs/004-drivers-management/spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/004-drivers-management/spec.md)

**Input**: Feature specification from `/specs/004-drivers-management/spec.md`

## Summary

The Drivers Management feature allows administrators to manage (Create, Read, Update, Delete) the fleet of drivers and track their availability status. The admin dashboard UI will provide a paginated, searchable list of all drivers, while forms will allow creation and updates. These driver statuses serve as the core roster for future booking management phases where "Available" drivers are assigned to confirmed trips.

The technical approach will leverage Next.js App Router (using React Server Components for fetching and Next.js Server Actions for mutations), styled with Tailwind CSS, secured by Supabase RLS, and verified with Vitest.

## Technical Context

**Language/Version**: TypeScript (v5+), Node.js (v18+)

**Primary Dependencies**: Next.js (v14+), React (v18+), `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `lucide-react`, `tailwindcss`

**Storage**: PostgreSQL (via Supabase)

**Testing**: Vitest (v1.0+)

**Target Platform**: Vercel (or any Node.js production hosting environment)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**:
- Admin list views, creation, modification, and deletion transitions return results in under 500ms.
- Search queries and pagination page changes process and render in under 500ms.

**Constraints**:
- Must enforce Row Level Security (RLS) policies on Supabase.
- Strict test-driven development (TDD) using Vitest.
- Phone number uniqueness must be enforced at both Zod validation and database levels.

**Scale/Scope**: Roster of up to 1000 drivers.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Log
- **Principle I: Clean and Modular Code** -> **PASS**. Codebase structured into reusable components, validation files, and dedicated server actions.
- **Principle II: Strict TypeScript & Next.js App Router Best Practices** -> **PASS**. Strict type definition for Driver schemas, separation of client vs server components.
- **Principle III: Secure Server-Side Operations & Supabase Integration** -> **PASS**. Supabase PostgreSQL with RLS policies enabled; Admin operations secured behind authentication checks in Server Actions.
- **Principle IV: Test-Driven Development (TDD) with Vitest** -> **PASS**. Vitest test suite configured to validate schemas and functions before writing business logic.
- **Principle V: Responsive, Mobile-First Tailwind UI** -> **PASS**. Styled with Tailwind CSS for mobile-first responsiveness.
- **Tech Stack Constraints** -> **PASS**. Center of stack is Next.js App Router, TypeScript, Tailwind, Supabase, and Vitest. No external states or router libraries added.

## Project Structure

### Documentation (this feature)

```text
specs/004-drivers-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database design
├── quickstart.md        # Phase 1 validation instructions
├── contracts/
│   └── actions.md       # Phase 1 Server Actions contract
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── admin/
│   │   └── drivers/
│   │       ├── page.tsx          # Admin Drivers page (RSC)
│   │       └── actions.ts         # Server Actions (Create, Update, Delete)
├── components/
│   └── driver-form.tsx           # Add/Edit Driver form component (Client Component)
├── lib/
│   └── validation/
│       └── driver.ts             # Driver validation and parsing schemas (Zod)
tests/
└── unit/
    └── driver.test.ts            # Vitest validation tests
```

**Structure Decision**: Single Next.js project layout utilizing `src/` directory. Next.js App Router is used for layouts and page routes. Database connections and authentication flows are delegated to Supabase.

## Complexity Tracking

*No violations of the Constitution identified; this plan is 100% compliant with the core technology stack and principles.*

---

## Verification Plan

### Automated Tests
- Run validation unit tests:
  ```bash
  npx vitest tests/unit/driver.test.ts
  ```

### Manual Verification
1. Deploy DB schema and constraints in Supabase SQL editor.
2. Launch dev server:
  ```bash
  npm run dev
  ```
3. Run the verification scenarios outlined in [quickstart.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/004-drivers-management/quickstart.md):
   - Add new driver form validation.
   - Verify unique constraint throws clean admin UI messages.
   - Verify status badges render correctly based on driver states.
   - Verify drivers search and pagination functions.
