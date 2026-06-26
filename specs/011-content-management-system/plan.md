# Implementation Plan: Content Management System (CMS)

**Branch**: `011-content-management-system` | **Date**: 2026-06-26 | **Spec**: [spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/011-content-management-system/spec.md)

**Input**: Feature specification from `/specs/011-content-management-system/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a Content Management System (CMS) that allows administrators to manage dynamic website text (Hero Title, About Us text, Contact Phone, Contact Email), branding colors (defaulting to Maroon and Royal Black), and visual assets (Hero Background, Site Logo). The implementation will use a single-row structured Supabase database table `site_settings` with a check constraint, a public Supabase Storage bucket `public_assets` with RLS policies, Next.js Server Actions for data fetching and mutation, and a responsive Tailwind CSS admin interface at `/admin/content`.

## Technical Context

**Language/Version**: TypeScript / Next.js App Router

**Primary Dependencies**: `@supabase/supabase-js` (or existing Supabase client), Tailwind CSS, React, Lucide Icons

**Storage**: Supabase Database (PostgreSQL) and Supabase Storage

**Testing**: Vitest for unit tests of Server Actions

**Target Platform**: Web browsers (Chrome, Safari, Firefox, Edge)

**Project Type**: Next.js Web Application

**Performance Goals**: Updates to settings reflect on public pages under 1s; admin content page loads under 2s.

**Constraints**: No rich-text editors (TipTap/CKEditor), no third-party CDNs (only Supabase Storage), single-row database constraint, Tailwind CSS styling.

**Scale/Scope**: Single global configuration settings row, image uploads up to 5MB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Modular Design**: Code organized into Server Actions, hooks, UI components, and test files.
- [x] **Strict TypeScript**: Full type safety for site settings and upload payloads. No `any`.
- [x] **Secure Server Operations**: Supabase database queries and storage uploads run securely with RLS policies and explicit error handling.
- [x] **Vitest Testing**: Unit/integration tests written with Vitest.
- [x] **Tailwind CSS UI**: Admin panel styled strictly with responsive Tailwind CSS.
- [x] **No WYSIWYG/CDNs**: Avoided heavy WYSIWYG editors and third-party CDNs to remain lightweight.

## Project Structure

### Documentation (this feature)

```text
specs/011-content-management-system/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── checklists/          # Contains requirements.md checklist
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── actions/
│   │   └── cms.ts              # Server Actions for settings & storage uploads
│   └── admin/
│       └── content/
│           └── page.tsx        # Admin CMS dashboard UI
├── components/                 # Shared React layout/visual elements
├── lib/
│   └── supabase/
│       ├── client.ts           # Supabase client helper
│       └── server.ts           # Supabase server client helper
└── types/
    └── index.ts                # Shared TypeScript types for settings

tests/
└── unit/
    └── cms-actions.test.ts     # Vitest unit tests for server actions

supabase/
└── migrations/
    └── 20260626000003_create_site_settings.sql # Migration script for DB schema & storage policies
```

**Structure Decision**: Single project Next.js structure. Created `src/app/admin/content/page.tsx` for Admin UI, `src/app/actions/cms.ts` for Server Actions, and `tests/unit/cms-actions.test.ts` for Vitest tests.

## Complexity Tracking

*No violations identified. Design adheres strictly to the project constitution.*
