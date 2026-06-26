# Quickstart: New Request Alert (Feature F-08)

This guide documents the setup and validation scenarios required to verify the admin notification alerts and pending badge count.

## Prerequisites

1. Define system environment variables in `.env.local` (ensure your SMTP server is configured, e.g. Mailtrap or custom SMTP):
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ADMIN_EMAIL=admin@airporttransfers.com
   ```
2. Verify that there is at least one active location pair and a valid price in the pricing matrix (Feature F-02).

## Run Verification Scenarios

### Scenario 1: Admin Email Notification Verification

1. Start the local dev server:
   ```bash
   npm run dev
   ```
2. Open the customer-facing booking wizard on the browser.
3. Complete Step 1 and Step 2 by selecting a valid route, date, and inputting valid passenger details.
4. Click **Confirm Booking**.
5. Log in or check your local SMTP inbox/Mailtrap dashboard:
   - Verify that a passenger confirmation email is received.
   - Verify that a **New Booking Request** notification email is sent to `admin@airporttransfers.com`.
   - Ensure the admin email contains the correct booking reference, route, customer name, date/time, and a hyperlink to the admin panel.

### Scenario 2: Dashboard Count Badge Verification

1. Log into the admin portal:
   - Navigate to `/admin/bookings`, `/admin/locations`, `/admin/pricing`, or `/admin/drivers`.
2. Observe the header/sidebar navigation links:
   - Verify that next to the **Bookings** link, a visual count badge displays the current count of pending bookings.
3. Submit a new booking as a customer.
4. Refresh or navigate the admin dashboard:
   - Verify that the count badge increments by 1.
5. In the bookings dashboard, select a pending booking and update its status to **Confirmed** or **Cancelled**:
   - Verify that the count badge decrements by 1.

### Scenario 3: Automated Test Suite

Run the Vitest suite to verify functionality:
```bash
npx vitest run tests/unit/booking-actions.test.ts
```
Expected output: All unit tests pass, confirming that the server actions perform pricing verification, database insertions, SMTP alerts, and count queries correctly.
