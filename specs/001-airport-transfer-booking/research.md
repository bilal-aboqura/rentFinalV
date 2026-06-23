# Research: Airport Transfer and Driver Booking System

This document outlines the architectural decisions, technical choices, and rationale for the implementation of the Airport Transfer and Driver Booking System.

## 1. Project Architecture (Separate Frontend & Backend)

- **Decision**: Implement a decoupled architecture consisting of a React + Vite frontend and a Node.js + Express backend, both using TypeScript.
- **Rationale**: 
  - Allows clean separation of concerns. The frontend can be served as a static bundle, optimizing performance and load times.
  - The backend acts as a stateless REST API, facilitating testing, security configurations, and database query tuning.
  - Facilitates deployment on a Linux VPS, where the backend can run via PM2 and Nginx can serve the frontend static files and reverse-proxy API requests.
- **Alternatives Considered**: Next.js App Router (defined in the original constitution). However, the user explicitly requested a separate Node.js/Sequelize backend and Vite/React frontend to optimize for standard VPS hosting constraints and custom JWT authentication.

---

## 2. Backend Tech Stack (Node.js, Express, PostgreSQL, Sequelize ORM)

- **Decision**: Build the REST API using Node.js, Express, and TypeScript. Use PostgreSQL for relational data storage and Sequelize ORM for schema definitions, migrations, and relationship management.
- **Rationale**:
  - PostgreSQL provides strong ACID compliance, transaction support, and relational integrity necessary for scheduling, pricing rules, and driver assignments.
  - Sequelize ORM handles complex relationships (e.g., Bookings belong to Locations/Drivers, PricingRules connect Locations).
  - TypeScript ensures compile-time type safety for models, request payloads, and API responses.
- **Alternatives Considered**: 
  - Prisma ORM: While very type-safe, Sequelize is highly robust for standard PostgreSQL setups and integrates natively with traditional migration patterns.
  - Supabase (original constitution stack): Rejected in favor of Sequelize/PostgreSQL to support custom on-premise VPS deployments without external SaaS dependencies.

---

## 3. Frontend Tech Stack (Vite, React, Tailwind CSS)

- **Decision**: Use Vite to scaffold a React single-page application (SPA) styled with Tailwind CSS.
- **Rationale**:
  - Vite offers extremely fast hot-module replacement (HMR) and optimized rollup-based production builds.
  - Tailwind CSS enables responsive, utility-first styling with minimal CSS overhead, adhering to the mobile-first UI requirement.
- **Alternatives Considered**: 
  - Next.js (Static Export): Next.js static builds are powerful, but Vite + React is simpler, lightweight, and has fewer dependency complexities when building client-only SPAs.

---

## 4. Secure Authentication (JWT & HTTP-Only Cookies)

- **Decision**: Implement JSON Web Tokens (JWT) for admin session management. The server will sign tokens upon successful credentials verification and send them via `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Rationale**:
  - Storing JWTs in HTTP-Only cookies mitigates Cross-Site Scripting (XSS) attacks.
  - Stateless authentication avoids database lookups for session validation on every API request.
- **Alternatives Considered**: 
  - Local Storage JWT storage: Rejected due to vulnerability to XSS attacks.
  - Session-based sessions (Express-Session with Redis): Rejected to avoid operational complexity of running Redis on the VPS for a single-admin dashboard.

---

## 5. Notification Dispatch (Nodemailer with SMTP)

- **Decision**: Use Nodemailer to send transactional emails via SMTP when bookings are created or updated. SMTP credentials will be loaded securely from `.env` environment variables.
- **Rationale**:
  - Nodemailer is lightweight, requires no external HTTP API SDKs, and can connect to any SMTP provider (like Resend, SendGrid, or mail servers).
  - Offers secure SMTP TLS options.
- **Alternatives Considered**:
  - Resend/SendGrid API Client: Rejected to avoid hard-coupling the code to a specific SaaS provider; standard SMTP works with any service.

---

## 6. VPS Deployment Configuration (PM2, Nginx, SSL)

- **Decision**: Configure Nginx as the primary reverse proxy and static file server. Use PM2 to run the Node.js API server, ensuring automatic restarts on failure. SSL certificates will be managed via Certbot (Let's Encrypt).
- **Rationale**:
  - Nginx handles static file serving of the Vite React bundle with extremely high performance and handles SSL/TLS termination securely.
  - Nginx routes `/api/*` to the local PM2 service and blocks direct external access to backend ports.
- **Alternatives Considered**:
  - Docker Compose: While excellent for containerization, direct PM2 + Nginx VPS deployment is simpler, has less CPU/memory overhead, and is standard for minimal Linux VPS instances.
