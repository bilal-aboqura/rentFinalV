# Implementation Plan: New Request Alert (Feature F-08)

**Branch**: `008-new-request-alert` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/008-new-request-alert/spec.md)

**Input**: Feature specification from `/specs/008-new-request-alert/spec.md`

## Summary

This feature hooks into the existing booking flow to alert administrators when a new booking is requested and display a pending booking badge count in the admin navigation. 

Upon successful booking insertion inside the Next.js Server Action `submitBookingAction`, the system will asynchronously call Nodemailer via the SMTP helper (`smtp.ts`) to send a formatted "New Booking Request" notification to the configured `ADMIN_EMAIL`. 

For the UI indicator, we will extract the repeated admin header/navbar layout from individual page files into a reusable Server Component `AdminNavbar` that fetches the pending bookings count (using a new Server Action `getPendingBookingsCount`) and renders a responsive Tailwind CSS badge next to the "Bookings" link.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+

**Primary Dependencies**: Next.js 15 (App Router), Nodemailer, Supabase JS client v2, Tailwind CSS

**Storage**: Supabase (PostgreSQL)

**Testing**: Vitest

**Target Platform**: Next.js Web Application (Node.js runtime)

**Project Type**: Web Application

**Performance Goals**:
- Email dispatch trigger in `submitBookingAction` must run asynchronously and return control to the client in under 200ms.
- `getPendingBookingsCount` query must execute in under 100ms.

**Constraints**:
- Stick to server-side SMTP and simple database querying; no websockets or real-time polling.
- Failures in the admin email alert must not interrupt or crash the guest checkout flow.

**Scale/Scope**:
- Admin panel header navigation badge.
- Configurable environment variable `ADMIN_EMAIL`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Clean and Modular Code**: PASSED. Navbar code is modularized by refactoring the repeated HTML from four admin pages into a single `AdminNavbar` component.
- **II. Strict TypeScript & Next.js App Router**: PASSED. Strictly typed server actions and parameters; proper App Router Server Action pattern.
- **III. Secure Server-Side Operations & Supabase Integration**: PASSED. Database operations run securely through Supabase server clients; `ADMIN_EMAIL` is processed entirely server-side.
- **IV. Test-Driven Development (TDD)**: PASSED. Vitest unit tests will verify the formatting of the admin email and the behavior of the pending count query.
- **V. Responsive, Mobile-First Tailwind UI**: PASSED. The badge will use standard Tailwind CSS classes matching the existing theme.

## Project Structure

### Documentation (this feature)

```text
specs/008-new-request-alert/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── alert-contracts.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── actions/
│   │   └── booking.ts             # Modify submitBookingAction
│   └── admin/
│       ├── bookings/
│       │   ├── actions.ts         # Add getPendingBookingsCount
│       │   └── page.tsx           # Use AdminNavbar component
│       ├── drivers/
│       │   └── page.tsx           # Use AdminNavbar component
│       ├── locations/
│       │   └── page.tsx           # Use AdminNavbar component
│       └── pricing/
│           └── page.tsx           # Use AdminNavbar component
├── components/
│   └── admin-navbar.tsx           # [NEW] Reusable Admin Header Navbar with Badge
├── lib/
│   └── mail/
│       └── smtp.ts                # Add sendAdminNotificationEmail
tests/
└── unit/
    ├── booking-actions.test.ts    # Update to mock and verify admin email trigger
    └── smtp.test.ts               # Test the admin email formatter
```

**Structure Decision**: Web application layout. We are refactoring the navbar inside `src/components/admin-navbar.tsx` and adding logic to `src/app/actions/booking.ts`, `src/app/admin/bookings/actions.ts`, and `src/lib/mail/smtp.ts`.

## Complexity Tracking

*No violations identified.*
