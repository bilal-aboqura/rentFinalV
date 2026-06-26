# Quickstart Validation Guide: Contact Form & Inquiries Management

This document provides runnable validation scenarios to verify that Feature F-10: Contact Form & Inquiries Management works end-to-end.

## 1. Automated Tests

Run the Vitest test suite to verify the contact actions validation logic, database integration mockups, and schema constraints:

```bash
npx vitest tests/unit/contact-validation.test.ts tests/unit/contact-actions.test.ts
```

Expected outcome: The unit tests in `tests/unit/contact-validation.test.ts` and `tests/unit/contact-actions.test.ts` execute and pass successfully.

---

## 2. Manual Verification Scenarios

Start the local Next.js development server:

```bash
npm run dev
```

### Scenario A: Public Inquiry Submission

1. Open a browser and navigate to the public page: [http://localhost:3000/contact](http://localhost:3000/contact).
2. Fill in the form fields with valid information:
   * **Full Name**: `John Doe`
   * **Email Address**: `john.doe@example.com`
   * **Subject**: `Custom Route Inquiry`
   * **Message**: `I would like to request custom pricing for a route from Location A to Location Z on July 4th.`
3. Click the **Submit** button.
4. Verify that:
   * A success message is displayed on screen (e.g. "Thank you! Your message has been sent successfully.").
   * The contact form fields are cleared.
   * A database check on `contact_inquiries` shows a new record created with status `'Unread'`.

### Scenario B: Validation Errors (Edge Case)

1. Navigate to `/contact` and attempt to submit the form empty.
2. Verify that client-side validation triggers, showing helpful validation errors under the name, email, subject, and message fields.
3. Enter an invalid email format (e.g. `john.doe@`) and try to submit.
4. Verify that a validation error appears for the email field ("Please enter a valid email address.").
5. Attempt to exceed field length boundaries (e.g., paste > 3000 characters in the message) and check that Zod/client-side length checks block submission.

### Scenario C: Admin Dashboard & Navbar Badge

1. Log into the application as an administrator.
2. Navigate to any page under `/admin` (e.g. `/admin/bookings`).
3. Verify that the `AdminNavbar` shows a notification badge with count `1` (or the correct unread count) next to the new **Inquiries** navigation tab.
4. Click on the **Inquiries** tab to navigate to [http://localhost:3000/admin/inquiries](http://localhost:3000/admin/inquiries).
5. Verify that:
   * The list shows all contact inquiries sorted with newest first (`created_at` descending).
   * The inquiry submitted in Scenario A is visible in the list with a status of "Unread".

### Scenario D: Managing Inquiries & Status Updates

1. On the `/admin/inquiries` page, click on the table row for the inquiry created in Scenario A.
2. Verify that a details modal opens showing the inquirer's full name, email, subject, and full message content.
3. Change the status dropdown in the modal from **Unread** to **Read**.
4. Close the modal or save changes and verify that:
   * The status in the data table updates to "Read".
   * The unread inquiries notification badge in the `AdminNavbar` decrements by 1.
5. Open the modal again and change the status to **Resolved**. Verify that the status updates to "Resolved" and the badge count does not increment.
