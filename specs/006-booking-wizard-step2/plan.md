# Implementation Plan: Trip Details Form & Booking Confirmation (Step 2)

**Branch**: `006-booking-wizard-step2` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/006-booking-wizard-step2/spec.md)

**Input**: Feature specification from [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/006-booking-wizard-step2/spec.md)

## Summary

This feature implements the second step of the booking wizard, capturing passenger details (Name, Email, E.164 Phone) and optional parameters (Flight Number, Notes). The data is validated with Zod, verified against the server-side pricing matrix to prevent client-side tampering, saved to a new PostgreSQL `bookings` table with status 'Pending', and a transactional SMTP email is dispatched. Finally, the wizard state is reset, and the user transitions to a success confirmation view showing the booking reference.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+

**Primary Dependencies**: Next.js 16.2.9, React 19.2.4, Supabase JS client (`@supabase/ssr`, `@supabase/supabase-js`), Zod 4.x, Lucide React, Nodemailer 6.x

**Storage**: PostgreSQL (Supabase) with a new `bookings` table

**Testing**: Vitest 4.x

**Target Platform**: Web application (Desktop & Mobile)

**Project Type**: Next.js Web Application (using App Router and Server Actions)

**Performance Goals**: Booking submission processed in < 1s; UI transition and state clearing completed in < 500ms

**Constraints**: Strict E.164 phone formatting; database RLS policies restricting guest access to reference-based SELECT only; no payment gateway integration.

**Scale/Scope**: Passenger input form component, server action processing, and success views within the booking wizard.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Core Principle | Evaluation / How It Is Checked | Status |
|:---|:---|:---|
| **I. Clean & Modular Code** | Single-purpose components (`booking-wizard-step2.tsx` separated from wizard container). Helper modules for SMTP and price checking. | `PASS` |
| **II. Strict TypeScript & Next.js App Router** | Strict type interfaces for state, payload, and server action responses. No usage of `any`. | `PASS` |
| **III. Secure Server-Side Operations & Supabase** | Row Level Security (RLS) on the `bookings` table. Price verification on the server side using the DB pricing matrix before saving. | `PASS` |
| **IV. Test-Driven Development (TDD)** | Vitest unit tests written to validate schemas, phone format checking, and schedule logic. | `PASS` |
| **V. Responsive, Mobile-First Tailwind UI** | Tailwind CSS utility styling for the step 2 form, order summary, and success view. | `PASS` |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-booking-wizard-step2/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Database schema and TS definitions
├── quickstart.md        # Validation scenarios and testing instructions
└── contracts/
    └── submit-booking.md # API / Server Action contracts
```

### Source Code

```text
src/
├── app/
│   └── actions/
│       └── booking.ts          # submitBookingAction Server Action
├── components/
│   ├── booking-wizard.tsx      # Multi-step state container
│   └── booking-wizard-step2.tsx # Passenger details form & success views
├── lib/
│   ├── mail/
│   │   └── smtp.ts             # [NEW] SMTP email dispatch utility
│   └── validation/
│       └── booking.ts          # Zod schema validations (Step 1 & 2)
tests/
└── unit/
    └── booking-step2.test.ts   # [NEW] Unit tests for Step 2 schemas
supabase/
└── migrations/
    └── 20260626000000_create_bookings.sql # [NEW] DB migration and RLS
```

**Structure Decision**: Single project Next.js structure. Supabase migrations are located under `supabase/migrations/`. Tests are located under `tests/unit/`.

---

## Complexity Tracking

*No principle violations detected. The architecture maintains a simple, decoupled, and secure flow without redundant layers.*
