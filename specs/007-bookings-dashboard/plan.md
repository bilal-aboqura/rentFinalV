# Implementation Plan: Bookings Management Dashboard

**Branch**: `007-bookings-dashboard` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/007-bookings-dashboard/spec.md)

**Input**: Feature specification from [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/007-bookings-dashboard/spec.md)

## Summary

This feature implements the Bookings Management Dashboard for administrators under `/admin/bookings`. It provides a responsive data table of reservation requests sorted by newest first, with server-side pagination and status filtering (Pending, Confirmed, Completed, Cancelled). It includes a details view (modal) for reviewing passenger contact details, notes, and flight info, assigning a driver from the active fleet, and updating the booking status. Critically, to preserve historical data integrity, status changes and driver assignments are blocked on bookings that are already in a terminal state (Completed or Cancelled).

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+

**Primary Dependencies**: Next.js 16.2.9, React 19.2.4, Supabase JS client (`@supabase/ssr`, `@supabase/supabase-js`), Zod 4.x, Lucide React

**Storage**: PostgreSQL (Supabase) with `bookings` table changes (added nullable `driver_id` referencing `drivers.id`, updated check constraint on `status` to support `'Completed'`).

**Testing**: Vitest 4.x

**Target Platform**: Web application (Desktop & Mobile)

**Project Type**: Next.js Web Application (using App Router and Server Actions)

**Performance Goals**: Table loads, filtering, and paging completed in < 500ms; status updates and driver assignments persisted in < 500ms.

**Constraints**: Access restricted to authenticated administrators; terminal state lock restricting modifications to Completed/Cancelled bookings; no invoicing or payment collection features.

**Scale/Scope**: Admin bookings subpage, server actions for management, detail modal component, and Vitest backend unit test suite.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Core Principle | Evaluation / How It Is Checked | Status |
|:---|:---|:---|
| **I. Clean & Modular Code** | Single-purpose components (`bookings-manager.tsx` and `booking-details-modal.tsx` separated from layouts). Helper actions for DB management. | `PASS` |
| **II. Strict TypeScript & Next.js App Router** | Strict type interfaces for joined state, payload, and server action responses. No usage of `any`. | `PASS` |
| **III. Secure Server-Side Operations & Supabase** | Row Level Security (RLS) on the `bookings` table. Administrator session validation in all Server Actions. | `PASS` |
| **IV. Test-Driven Development (TDD)** | Vitest unit tests written to validate Server Action status modifications and lock validation rules. | `PASS` |
| **V. Responsive, Mobile-First Tailwind UI** | Tailwind CSS utility styling for the admin dashboard list table and details modal. | `PASS` |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-bookings-dashboard/
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Database schema and TS definitions
├── quickstart.md        # Validation scenarios
└── contracts/
    └── booking-actions.md # API / Server Action contracts
```

### Source Code

```text
src/
├── app/
│   └── admin/
│       └── bookings/
│           ├── actions.ts    # [NEW] fetch, update status, assign driver actions
│           └── page.tsx      # [NEW] Admin bookings dashboard page
├── components/
│   ├── bookings-manager.tsx  # [NEW] Interactive dashboard manager with table and filter controls
│   └── booking-details-modal.tsx # [NEW] Modal showing booking details and assignment forms
├── lib/
│   └── validation/
│       └── booking.ts        # [MODIFY] Add UpdateBookingStatusSchema and AssignDriverSchema
tests/
└── unit/
    └── booking-dashboard.test.ts # [NEW] Unit tests for terminal locks and actions
supabase/
└── migrations/
    └── 20260626000001_update_bookings_schema.sql # [NEW] Migration adding driver_id and completed status
```

**Structure Decision**: Single project Next.js structure. Supabase migrations are located under `supabase/migrations/`. Tests are located under `tests/unit/`.

---

## Verification Plan

### Automated Tests
Run Vitest to verify schemas and Server Action rules:
- `npx vitest run tests/unit/booking-dashboard.test.ts`

### Manual Verification
Refer to [quickstart.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/007-bookings-dashboard/quickstart.md) for step-by-step UI and database check flows:
- Navigate to `/admin/bookings`
- Select status filters (Pending, Confirmed, Completed, Cancelled)
- Test page navigation (next/previous)
- View details, select driver, and change status on a Pending booking
- Verify that a Completed/Cancelled booking has disabled forms and rejects modifications
