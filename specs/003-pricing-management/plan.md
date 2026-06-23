# Implementation Plan: Pricing Management

**Branch**: `003-pricing-management` | **Date**: 2026-06-23 | **Spec**: [specs/003-pricing-management/spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/003-pricing-management/spec.md)

**Input**: Feature specification from `/specs/003-pricing-management/spec.md`

## Summary

The Pricing Management feature allows administrators to manage (Create, Read, Update, Delete) trip flat-rate prices based on pickup locations and destination locations. The admin dashboard UI will provide a paginated list of all pricing rules, while forms will allow creation and modifications. These route prices serve as the core engine for the customer-facing booking wizard to instantly calculate and display the cost of a trip.

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
- Customer booking wizard retrieves location route pricing in under 500ms.

**Constraints**:
- Single flat price per route (no vehicle class differentiation).
- Must enforce Row Level Security (RLS) policies on Supabase.
- Strict test-driven development (TDD) using Vitest.

**Scale/Scope**: Manageable list of route prices (up to 2000 records), serving customer booking price calculation requests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Log
- **Principle I: Clean and Modular Code** -> **PASS**. Codebase structured into reusable components, validation files, and dedicated server actions.
- **Principle II: Strict TypeScript & Next.js App Router Best Practices** -> **PASS**. Strict type definition for RoutePrice schemas, separation of client vs server components.
- **Principle III: Secure Server-Side Operations & Supabase Integration** -> **PASS**. Supabase PostgreSQL with RLS policies enabled; Admin operations secured behind authentication checks in Server Actions.
- **Principle IV: Test-Driven Development (TDD) with Vitest** -> **PASS**. Vitest test suite configured to validate schemas and functions before writing business logic.
- **Principle V: Responsive, Mobile-First Tailwind UI** -> **PASS**. Styled with Tailwind CSS for mobile-first responsiveness.
- **Tech Stack Constraints** -> **PASS**. Center of stack is Next.js App Router, TypeScript, Tailwind, Supabase, and Vitest. No external states or router libraries added.

## Project Structure

### Documentation (this feature)

```text
specs/003-pricing-management/
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
│   │   └── pricing/
│   │       ├── page.tsx          # Admin Pricing page (RSC)
│   │       └── actions.ts         # Server Actions (Create, Update, Delete)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── table.tsx
│   │   └── modal.tsx
│   └── pricing-form.tsx          # Add/Edit Route Price form component (Client component)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client (Client component use)
│   │   └── server.ts             # Supabase server client (RSC / Server Action use)
│   └── validation/
│       └── pricing.ts            # Route price validation and parsing schemas
└── types/
    └── index.ts                  # Shared TypeScript interfaces
    
tests/
└── unit/
    └── pricing.test.ts           # Vitest validation tests
```

**Structure Decision**: Single Next.js project layout utilizing `src/` directory. Next.js App Router is used for layouts and page routes. Database connections and authentication flows are delegated to Supabase.

## Complexity Tracking

*No violations of the Constitution identified; this plan is 100% compliant with the core technology stack and principles.*

---

## Verification Plan

### Automated Tests
- Run validation unit tests:
  ```bash
  npx vitest tests/unit/pricing.test.ts
  ```

### Manual Verification
1. Deploy DB schema and constraints in Supabase SQL editor.
2. Launch dev server:
  ```bash
  npm run dev
  ```
3. Run the verification scenarios outlined in [quickstart.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/003-pricing-management/quickstart.md):
   - Add new route price form validation.
   - Verify unique constraint throws clean admin UI messages.
   - Verify same-location and non-positive price blocks work.
   - Verify booking wizard retrieves correct route price.
