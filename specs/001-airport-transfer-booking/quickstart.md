# Quickstart & Verification Guide: Airport Transfer and Driver Booking System

This guide outlines how to configure, run, and verify the feature end-to-end using Next.js and Supabase.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **Supabase CLI** (optional for local DB setup) or a active Supabase project URL

---

## Environment Setup

Create a `.env.local` file in the project root directory:

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

## Installation & DB Setup

Run the following commands in the project root directory to initialize the application:

```bash
# 1. Install dependencies
npm install

# 2. Run Database Migrations
# Option A: Local Supabase CLI
npx supabase migration up

# Option B: Copy SQL migrations from supabase/migrations/20260623000000_init_schema.sql 
# and paste them directly into the Supabase project SQL Editor.
```

---

## Running the Application

Start the Next.js development server:

```bash
# Start Next.js App (runs on http://localhost:3000 by default)
npm run dev
```

---

## Automated Verification (Vitest)

All tests must be run using Vitest. First verify tests fail, then implement code until they pass.

```bash
# Run unit and integration test suite
npx vitest
```

---

## Manual E2E Validation Scenarios

### Scenario 1: Customer Booking Submission
1. Navigate to the booking page: `http://localhost:3000`.
2. Select **Pickup**: `City Center` and **Destination**: `International Airport`.
3. Select a future date/time.
4. Select vehicle class: `Standard` (the calculated estimate of `$45.00` should render dynamically).
5. Fill out Name, Email, Phone and submit.
6. **Expected Outcome**: Confirmation screen shows booking ID `BK-XXXXXX`. Check Supabase `bookings` table for a record with status `pending`, and verify that an admin alert record is logged in the `notifications` table.

### Scenario 2: Admin Authentication and Status Transition
1. Navigate to `http://localhost:3000/admin/login`.
2. Login with your admin credentials.
3. Access the Bookings tab. Open the newly created customer booking.
4. Click **Confirm booking**.
5. **Expected Outcome**: Booking status becomes `confirmed`. Check terminal logs/SMTP trap to verify a transactional email was dispatched to the customer's email address.
6. Attempt to assign an active driver to this booking who is already assigned to a booking within a 3-hour window. Verify the system outputs a validation warning and blocks the assignment.
