# Implementation Plan: Contact Form & Inquiries Management

**Branch**: `010-contact-inquiries` | **Date**: 2026-06-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-contact-inquiries/spec.md`

## Summary

This feature adds a public contact form and a secure admin management interface for customer inquiries. 
* **Customer UI**: Public `/contact` page with a mobile-first, validated form using Tailwind CSS.
* **Backend**: Server Action (`submitContactForm`) to validate using Zod and insert into Supabase with "Unread" status.
* **Admin UI**: Paginated inquiries dashboard at `/admin/inquiries` allowing status updates ("Unread", "Read", "Resolved") via detail modals, backed by Server Actions.
* **Notification**: Navbar badge in `AdminNavbar` dynamically displaying the count of unread inquiries.

## Technical Context

**Language/Version**: TypeScript / Next.js 15+ (App Router)

**Primary Dependencies**: React, Tailwind CSS, Zod, `@supabase/supabase-js`

**Storage**: Supabase / PostgreSQL (new table `contact_inquiries`)

**Testing**: Vitest

**Target Platform**: Web (Next.js App Router)

**Project Type**: Full-stack Web Application

**Performance Goals**: Contact page load/submit < 1s; admin dashboard load < 1s.

**Constraints**: VPS deployment constraints, so no real-time WebSocket connection to keep the resource footprint minimal. Count fetched on load/navigation.

**Scale/Scope**: Expects up to 100 inquiries/day, 10k total records in database.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Constraint | Status | Compliance Details |
| :--- | :--- | :--- |
| **I. Clean and Modular Code** | Passed | Actions and validation schemas separated. UI components kept small. |
| **II. TypeScript & Next.js App Router** | Passed | Type-safe payloads/responses. Proper Server Component/Client Component separation. |
| **III. Secure Server & Supabase Integration** | Passed | RLS policies enforced: public can only write new inquiries; admins get full access. |
| **IV. Test-Driven Development (Vitest)** | Passed | Unit tests written for Server Actions and Zod schemas using Vitest. |
| **V. Responsive, Mobile-First Tailwind UI** | Passed | Contact form and admin panels styled strictly with Tailwind CSS. |
| **Technology Stack Constraints** | Passed | Standard stack used (Next.js, Supabase, Tailwind, Vitest). No extra packages. |

## Project Structure

### Documentation (this feature)

```text
specs/010-contact-inquiries/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database schema & security definition
├── quickstart.md        # Phase 1 validation scenarios
└── contracts/
    └── server-actions.md # Phase 1 server action signature contracts
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── actions/
│   │   └── contact.ts    # [NEW] Public server action for contact form submission
│   ├── admin/
│   │   └── inquiries/
│   │       ├── actions.ts # [NEW] Admin inquiries server actions
│   │       └── page.tsx  # [NEW] Admin inquiries list dashboard
│   └── contact/
│       └── page.tsx      # [NEW] Public contact form page
├── components/
│   └── admin-navbar.tsx  # [MODIFY] Admin navigation menu (added inquiries tab & badge)
├── lib/
│   └── validation/
│       └── contact.ts    # [NEW] Zod validation schema for contact form fields
tests/
└── unit/
    ├── contact-actions.test.ts # [NEW] Vitest unit tests for server actions
    └── contact-validation.test.ts # [NEW] Vitest unit tests for Zod validation
```

**Structure Decision**: Single Next.js project layout structure. Server actions are separated into public actions (`src/app/actions/contact.ts`) and admin-only actions (`src/app/admin/inquiries/actions.ts`) to mirror the bookings structure.

## Complexity Tracking

*No violations detected.*
