# Quickstart & Verification Guide: Airport Transfer and Driver Booking System

This guide outlines how to configure, run, and verify the feature end-to-end.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **PostgreSQL**: v14.0.0 or higher running locally or accessible via network

---

## Environment Setup

### 1. Backend Environment Setup
Create a `.env` file in the backend root directory:
```ini
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/airport_transfer_booking
JWT_SECRET=super_secret_jwt_key_change_in_production
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=test_smtp_user
SMTP_PASS=test_smtp_password
SMTP_FROM=noreply@airporttransfers.com
```

### 2. Frontend Environment Setup
Create a `.env` file in the frontend root directory:
```ini
VITE_API_URL=http://localhost:5000
```

---

## Installation & DB Setup

Run the following commands to initialize the project:

```bash
# 1. Install dependencies (Root workspace containing both directories)
npm install

# 2. Run Database Migrations (Backend)
npm --prefix backend run migrate

# 3. Seed Database with initial mock data (Admin user, Locations, Pricing, FAQs)
npm --prefix backend run seed
```

---

## Running the Application

Start the development servers:

```bash
# Start backend API server (runs on Port 5000)
npm --prefix backend run dev

# Start frontend application (runs on Port 5173)
npm --prefix frontend run dev
```

---

## Automated Verification (Vitest)

All tests must be run using Vitest. First verify tests fail, then implement code until they pass.

```bash
# Run backend test suite (unit and integration tests)
npm --prefix backend test

# Run frontend UI component test suite
npm --prefix frontend test
```

---

## Manual E2E Validation Scenarios

### Scenario 1: Customer Booking Submission
1. Navigate to the booking page: `http://localhost:5173`.
2. Select **Pickup**: `City Center` and **Destination**: `International Airport`.
3. Select a future date/time.
4. Select vehicle class: `Standard` (the calculated price of `$45.00` should render dynamically).
5. Fill out Name, Email, Phone and submit.
6. **Expected Outcome**: Confirmation screen shows booking ID `BK-XXXXXX`. Check database `bookings` table for status `pending` and `notifications` table for admin alert.

### Scenario 2: Admin Authentication and Status Transition
1. Navigate to `http://localhost:5173/admin`.
2. Login with credentials: `admin` / `SecurePassword123` (seeded).
3. View the booking list. Click the newly created booking.
4. Click **Confirm booking**.
5. **Expected Outcome**: Booking status becomes `confirmed`. Check terminal logs/SMTP trap to verify a transactional email was dispatched to the customer's email address.
