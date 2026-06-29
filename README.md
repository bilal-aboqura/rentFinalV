# Airport Transfer and Driver Booking System

A unified Next.js web application with a public-facing customer booking interface and a secure, private administration dashboard. Customers can calculate flat-rate quotes and book airport transfers as guest users; authenticated admins manage bookings, drivers, route pricing, locations, site content, and notifications.

## Architecture

- **Framework**: Next.js (v14+ App Router) written in TypeScript.
- **Database & Storage**: Supabase PostgreSQL with Row Level Security (RLS) policies, and Supabase Storage for visual branding assets.
- **Authentication**: Supabase Auth (via `@supabase/ssr` for secure, cookie-based sessions).
- **Styling**: Responsive, mobile-first UI built strictly using Tailwind CSS.
- **Notifications**: Transactional customer updates dispatched via SMTP using Nodemailer; admin alerts logged directly in the database.
- **Testing**: Test-Driven Development (TDD) enforced using Vitest.

---

## Directory Structure

```text
src/
├── app/
│   ├── (customer)/
│   │   ├── page.tsx              # Public customer booking interface
│   │   ├── actions.ts            # Public Server Actions (bookings / contact)
│   │   └── contact/
│   │       └── page.tsx          # Guest contact form page
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx          # Admin authentication screen
│   │   └── dashboard/
│   │       ├── layout.tsx        # Responsive dashboard layout & sidebar
│   │       ├── bookings/
│   │       │   └── page.tsx      # Admin bookings dashboard (search/filter/details)
│   │       ├── drivers/
│   │       │   └── page.tsx      # Driver profiles CRUD panel
│   │       ├── settings/
│   │       │   └── page.tsx      # Locations & flat-rate pricing configuration
│   │       └── content/
│   │           └── page.tsx      # Dynamic CMS (FAQ & website info) settings
│   │       └── actions.ts        # Admin Server Actions (status update, assignment, CRUDs)
│   ├── layout.tsx                # Base HTML & metadata wrapper
│   └── page.tsx
├── components/
│   ├── ui/                       # Shared UI kit (Button, Modal, Card, Table)
│   ├── booking-form.tsx          # Customer booking wizard component
│   └── notifications-list.tsx    # Admin dashboard notification panel
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   └── server.ts             # Supabase server-side client
│   ├── validation/
│   │   └── schema.ts             # Zod data validation rules
│   └── email/
│       └── nodemailer.ts         # SMTP transactional email utility
└── types/
    └── index.ts                  # Shared TypeScript types & interfaces

tests/
├── unit/                         # Schema validation and component rendering unit tests
└── integration/                  # Server Actions and database integration tests

supabase/
└── migrations/                   # SQL migration scripts for tables and RLS policies
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **Supabase CLI** (optional for local database migrations) or an active Supabase project

---

## Environment Setup

Create a `.env.local` file in the project root directory and populate it with your credentials:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=test_smtp_user
SMTP_PASS=test_smtp_password
SMTP_FROM=noreply@airporttransfers.com
```

---

## Installation & Database Setup

1. Install all dependencies:
   ```bash
   npm install
   ```

2. Apply database schemas, relations, and RLS policies:
   ```bash
   # Run local migration via Supabase CLI
   npx supabase migration up
   
   # Or copy the contents of supabase/migrations/ to the Supabase SQL editor
   ```

---

## Running the Application (Development)

Start the Next.js local development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the customer interface and `http://localhost:3000/admin/login` to access the secure admin dashboard.

---

## Testing

Run the test suite using Vitest (TDD is enforced; tests must fail before implementation):

```bash
# Run unit and integration tests
npx vitest

# Run in watch mode
npx vitest watch
```

---

## Manual Validation Scenarios

### Customer Booking
1. Open the booking landing page and fill out pickup, destination, future date/time, and vehicle class.
2. Verify the flat-rate estimate calculates dynamically.
3. Complete passenger details and submit the form.
4. Verify the confirmation screen displays a reference code, a pending booking record is created in Supabase, and an admin notification is logged.

### Admin status changes & driver assignment
1. Access `/admin/login`, log in, and view the Bookings list.
2. Confirm the pending booking, and verify the customer receives a confirmation email.
3. Assign an active driver, and verify that the system blocks overlapping schedule assignments (within 3 hours).
