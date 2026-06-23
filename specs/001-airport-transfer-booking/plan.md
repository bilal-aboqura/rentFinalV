# Implementation Plan: Airport Transfer and Driver Booking System

**Branch**: `001-airport-transfer-booking` | **Date**: 2026-06-23 | **Spec**: [specs/001-airport-transfer-booking/spec.md](file:///c:/Users/anasa/Desktop/rentFinal/specs/001-airport-transfer-booking/spec.md)

**Input**: Feature specification from `/specs/001-airport-transfer-booking/spec.md`

**Note**: This plan defines the custom tech stack, architecture, and project structure as requested by the user, and details the alignment with the project constitution.

## Summary

The Airport Transfer and Driver Booking System is a decoupled web application comprising a public-facing customer booking interface and a secure, private administration dashboard. 

The customer interface allows guest users to calculate flat-rate route quotes, select vehicle classes, and book airport transfers. The admin dashboard facilitates comprehensive management of bookings, driver profiles, locations, flat-rate pricing, and dynamic website content. 

The technical approach implements a Node.js + Express backend written in TypeScript, interacting with a PostgreSQL database via the Sequelize ORM. The frontend is built as a single-page React application using Vite and styled with Tailwind CSS. Authentication uses JWT stored in HTTP-Only cookies. Automatic notifications are generated internally as database logs for admins and dispatched via Nodemailer SMTP for customer booking updates.

## Technical Context

**Language/Version**: Node.js (v18+), TypeScript (v5+)

**Primary Dependencies**: 
- **Backend**: `express`, `sequelize`, `pg`, `pg-hstore`, `jsonwebtoken`, `cookie-parser`, `bcryptjs`, `nodemailer`, `cors`
- **Frontend**: `react`, `react-dom`, `react-router-dom`, `tailwindcss`, `lucide-react`

**Storage**: PostgreSQL (v14+)

**Testing**: Vitest (v1.0+)

**Target Platform**: Linux VPS (Ubuntu 22.04 LTS recommended, with Nginx and PM2)

**Project Type**: Web application (Decoupled frontend client + backend API service)

**Performance Goals**:
- Page load times under 1 second.
- Admin search/filter query response times under 1 second.
- Notification event logs generated within 500ms of trigger events.

**Constraints**:
- Strictly exclude iOS/Android mobile apps, AI features, multi-language support, complex commission logic, and marketing integrations.
- Booking routes are strictly flat-rate-based city/airport connections managed by the admin. Real-time map distance calculations are excluded.

**Scale/Scope**: Single admin account, up to 1,000 booking requests per day, simple location set (cities and airports).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Log
- **Principle I: Clean and Modular Code** -> **PASS**. Codebase structured with clear Separation of Concerns: controllers, services, models, and routes in the backend; components, pages, and API clients in the frontend.
- **Principle II: Strict TypeScript** -> **PASS**. Strict type checking enabled on both frontend and backend configurations.
- **Principle IV: Test-Driven Development (TDD) with Vitest** -> **PASS**. Vitest test suites configured in both `backend/` and `frontend/` workspaces. Tests must fail before implementation.
- **Principle V: Responsive, Mobile-First Tailwind UI** -> **PASS**. Styled strictly using Tailwind CSS utility classes and designed for mobile screens first.
- **Principle III: Secure Server-Side Operations & Supabase Integration** -> **VIOLATION (Justified)**. The project does not use Supabase. It uses a custom Node.js/PostgreSQL/Sequelize backend with custom JWT authentication.
- **Tech Stack Constraints (Next.js App Router)** -> **VIOLATION (Justified)**. Next.js App Router is replaced by Vite + React for the frontend and Node.js + Express for the backend.

## Project Structure

### Documentation (this feature)

```text
specs/001-airport-transfer-booking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 database design
├── quickstart.md        # Phase 1 validation instructions
├── contracts/
│   └── api.md           # Phase 1 REST API contract
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/          # Database connection & Sequelize config
│   ├── controllers/     # Route request handlers
│   ├── middleware/      # Auth, error, and validation middleware
│   ├── models/          # Sequelize schema model classes
│   ├── routes/          # API route registrations
│   ├── services/        # Business logic & SMTP notification services
│   └── app.ts           # Express application initialization
├── tests/
│   ├── integration/     # REST API endpoint tests
│   └── unit/            # Business validation & controller tests
├── migrations/          # DB schema migration scripts
├── seeders/             # Initial mock data and admin account seed scripts
├── tsconfig.json
└── package.json

frontend/
├── src/
│   ├── components/      # Common UI elements (Button, Card, Input)
│   ├── pages/           # Page views (Booking, Contact, AdminDashboard)
│   ├── services/        # Backend API integration clients
│   ├── App.tsx          # Router layout and entry structure
│   └── main.tsx         # React DOM mount point
├── tests/
│   └── unit/            # Component rendering & utility tests
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Structure Decision**: Decoupled multi-workspace layout with separate `backend/` (Express API) and `frontend/` (Vite SPA React app) folders.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Custom Node.js + Sequelize Backend (Replaces Supabase) | User requested custom PostgreSQL relational schema management, Sequelize ORM, and deployment optimization on standard Linux VPS. | Direct Supabase hosting was rejected to keep the system self-hosted, minimal, and fully self-contained on a VPS without SaaS dependencies. |
| Vite + React Frontend (Replaces Next.js) | Decoupled client/server model specifically requested. Allows static build serving via Nginx. | Next.js App Router static exports have complex path behaviors for custom backend routing on standard VPS reverse proxies. |
| JWT Cookie Auth (Replaces Supabase Auth) | Stateless secure authentication required for custom Express API server. | Session-based state requires Redis or database session tables, which adds resource overhead. |
