# Research: Airport Transfer and Driver Booking System

This document outlines the architectural decisions, technical choices, and rationale for the implementation of the Airport Transfer and Driver Booking System.

## 1. Unified Application Architecture (Next.js App Router)

- **Decision**: Implement a unified web application using Next.js App Router (React Server Components and Server Actions) in TypeScript.
- **Rationale**:
  - Unifies client and server code into a single, cohesive repository, eliminating the need to coordinate separate deployments for frontend and backend.
  - Leverages React Server Components (RSC) for fast, secure, direct database querying on the server without client-side API requests.
  - Simplifies routing and layouts using Next.js file-system routing.
- **Alternatives Considered**: Separate React + Vite SPA frontend and Express backend. This was the previous architecture choice, which was rejected because it introduces unnecessary dev-ops overhead (running PM2 and Nginx reverse proxies separately), duplicates TypeScript interfaces, and violates the RentFinal Constitution.

---

## 2. Server Data Mutations (Next.js Server Actions)

- **Decision**: Use Next.js Server Actions for all form submissions and data mutations (creating bookings, changing statuses, CRUDing drivers, etc.).
- **Rationale**:
  - Provides a secure, RPC-like mechanism to call server-side functions directly from client components.
  - Integrates natively with React form actions, enabling progressive enhancement and simple state management.
  - Eliminates the need to write REST controllers, register routes, and configure CORS on an Express server.
- **Alternatives Considered**: Standard REST API endpoints (e.g. `/api/bookings`). Rejected because it requires redundant boilerplate for endpoints that are only consumed by this application.

---

## 3. Database Layer (Supabase PostgreSQL & Storage)

- **Decision**: Use Supabase PostgreSQL as the primary database, utilizing Supabase Storage for brand and page media assets.
- **Rationale**:
  - PostgreSQL provides ACID compliance, structured schemas, unique constraints, and foreign key relations needed for scheduling, driver schedules, and flat-rate pricing rules.
  - Row Level Security (RLS) policies provide database-level security checks, ensuring only authenticated admins can manage locations, drivers, and pricing.
  - Supabase Storage manages image asset storage (such as logo and hero images) securely and simply using the unified `@supabase/supabase-js` client.
- **Alternatives Considered**: Custom PostgreSQL VPS database managed via Sequelize ORM. Rejected to keep the setup aligned with the project constitution and use Supabase's built-in security layer (RLS).

---

## 4. Secure Authentication (Supabase Auth)

- **Decision**: Authenticate administrators using Supabase Auth with server-side helper `@supabase/ssr` to maintain secure, cookie-based sessions.
- **Rationale**:
  - Out-of-the-box user management, secure password hashing, and session management.
  - Seamlessly links authenticated user roles with Supabase RLS policies.
- **Alternatives Considered**: Custom JWT authentication with custom tables in a standard database. Rejected because writing security-critical code from scratch is error-prone, whereas Supabase Auth is standardized and highly secure.

---

## 5. Notification Dispatch (Nodemailer via SMTP)

- **Decision**: Send guest transactional email alerts (booking submissions, status transitions, driver assignments) using Nodemailer via SMTP from Server Actions.
- **Rationale**:
  - Nodemailer is a robust, standard library for sending emails in Node.js.
  - SMTP configuration is provider-agnostic, allowing the system to use any email provider (e.g. Resend, Mailgun, or standard mail servers) simply by changing environment variables.
- **Alternatives Considered**: Coupling directly to a proprietary SaaS API (like SendGrid or Resend SDK). Rejected to ensure the email system is fully SMTP-compliant and portable.
