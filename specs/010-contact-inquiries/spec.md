# Feature Specification: Contact Form & Inquiries Management

**Feature Branch**: `010-contact-inquiries`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-10: "Contact Form & Inquiries Management" for the CMS & General epic. The purpose is to allow customers to send general inquiries (or request custom route pricing) and allow admins to manage these messages.

Requirements:
1. Customer UI: Create a public `/contact` page featuring a highly responsive, mobile-first form. Fields: Full Name (required), Email Address (required, valid format), Subject (required), and Message (required text area). Add a success message upon submission.
2. Database Persistence: Save submissions to a new `contact_inquiries` table with a default status of "Unread".
3. Admin UI: Create a dedicated page in the admin dashboard (e.g., `/admin/inquiries`) with a data table listing all received messages, sorted by newest first (`created_at` descending). 
4. Admin Actions: Admins must be able to read the full message (via a details modal) and update the inquiry's status (Enum: "Unread", "Read", "Resolved"). Include basic server-side pagination.
5. Navbar Indicator: Add a visual notification badge to the `AdminNavbar` component (similar to F-08) showing the count of "Unread" inquiries.
6. Constraint: Do NOT integrate SMTP or automated email replies for contact submissions at this stage; keep it strictly database-logged to prevent scope creep."

## Clarifications

### Session 2026-06-26

- Q: Should the unread inquiry count badge in `AdminNavbar` update in real-time via Supabase realtime subscriptions, or is it sufficient to fetch it on page load/action navigation (with manual state updates or Next.js page revalidation)? → A: Fetch on page load/navigation using Next.js. Do not implement Supabase Realtime subscriptions to keep the VPS infrastructure lightweight and avoid websocket overhead.
- Q: The description mentions requesting custom route pricing. Should the contact form include dedicated optional route fields (e.g., Pickup Location, Destination Location, Date/Time) to capture structured data, or should customers write these details in the standard "Message" text box? → A: Message box only. Keep the contact form strictly general-purpose with only Name, Email, Subject, and Message fields. Customers requesting custom routes will simply describe their needs in the text area. Do not add dedicated route fields or extra database columns.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit Contact Inquiry (Priority: P1)

As a website visitor, I want to fill out and submit a contact form on the `/contact` page with my name, email, subject, and message, so that I can send an inquiry or request custom route pricing and see a confirmation of submission.

**Why this priority**: This is the core customer-facing functionality of the feature, providing the primary way for users to send inquiries.

**Independent Test**: Visit `/contact`, fill in all required fields with valid input, submit the form, and verify that the success message is shown, the form is cleared, and the submission is persisted in the database.

**Acceptance Scenarios**:

1. **Given** the public `/contact` page, **When** the user enters a valid name, email, subject, and message, and submits the form, **Then** a success message is displayed, the form is cleared, and the submission is persisted in `contact_inquiries` table with status "Unread".
2. **Given** the public `/contact` page, **When** the user attempts to submit the form with empty required fields or an invalid email format, **Then** validation errors are displayed next to the respective fields, and the form is not submitted.

---

### User Story 2 - Admin View Inquiries List (Priority: P1)

As an admin, I want to view a list of all contact inquiries in the admin panel, sorted by newest first, with pagination, so that I can keep track of customer submissions.

**Why this priority**: Core admin-facing functionality to view and manage incoming inquiries.

**Independent Test**: Navigate to `/admin/inquiries` and verify that a table of inquiries is loaded, showing the fields, status, and sorted newest first.

**Acceptance Scenarios**:

1. **Given** an admin logged into the admin dashboard, **When** they visit `/admin/inquiries`, **Then** they see a paginated list of inquiries displaying name, email, subject, status, and creation date, sorted by `created_at` descending.
2. **Given** a large number of inquiries, **When** the admin clicks pagination controls, **Then** the list transitions to the correct page of records from the database.

---

### User Story 3 - Admin Manage Inquiry (Priority: P2)

As an admin, I want to click on an inquiry to view its full details in a modal and update its status, so that I can read the full message and mark it as Read or Resolved.

**Why this priority**: Required to process and resolve inquiries.

**Independent Test**: Open an inquiry's details modal, change the status, and check that the status is updated in the database and list UI.

**Acceptance Scenarios**:

1. **Given** the `/admin/inquiries` page, **When** the admin clicks on a specific inquiry row, **Then** a modal opens showing the inquirer's full name, email, subject, full message content, and status dropdown.
2. **Given** the inquiry details modal, **When** the admin changes the status in the dropdown (e.g. from "Unread" to "Read" or "Resolved"), **Then** the inquiry's status is saved to the database, and the list and navbar badge are updated accordingly.

---

### User Story 4 - Admin Navbar Unread Indicator (Priority: P2)

As an admin, I want to see the count of unread inquiries as a notification badge in the AdminNavbar, so that I am alerted to new inquiries regardless of which admin page I am viewing.

**Why this priority**: Enhances admin workflow and responsiveness to customer inquiries.

**Independent Test**: Submit a new inquiry from the public page, log into the admin dashboard, and check the badge count in the navbar.

**Acceptance Scenarios**:

1. **Given** any page in the admin dashboard with the `AdminNavbar`, **When** there are active "Unread" inquiries in the database, **Then** a badge showing the correct count of "Unread" inquiries is visible in the navbar.
2. **Given** a badge showing a count of unread inquiries, **When** an admin updates an inquiry's status to "Read" or "Resolved", **Then** the count shown in the badge decreases by 1.

---

### Edge Cases

- **Double Submissions**: What happens if the customer submits the contact form multiple times consecutively?
  - The submit button must be disabled during submission processing to prevent duplicate submissions.
- **Input Boundaries**: What happens when a customer attempts to submit a message that exceeds database field limits?
  - The form fields must have reasonable length constraints (e.g., name: 100 characters, subject: 150 characters, message: 3000 characters) enforced both client-side and server-side.
- **Database Transaction Failures**: What happens if the status update database transaction fails?
  - An error message should be displayed to the admin in the modal, and the UI status should rollback or remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a public `/contact` page containing a mobile-first, responsive contact form.
- **FR-002**: The contact form MUST contain the following fields: Full Name (required, text), Email Address (required, valid format), Subject (required, text), and Message (required, text area).
- **FR-003**: The contact form MUST validate fields before submission and display user-friendly error messages if validation fails.
- **FR-004**: Upon successful submission, the system MUST clear the form and display a clear success message to the customer.
- **FR-005**: The system MUST save all contact form submissions to a new `contact_inquiries` table with a default status of "Unread".
- **FR-006**: The system MUST provide a secure page `/admin/inquiries` accessible only to authenticated administrators.
- **FR-007**: The `/admin/inquiries` page MUST list contact inquiries in a data table showing sender name, email, subject, status, and creation date, sorted by `created_at` descending.
- **FR-008**: The admin list view MUST support basic server-side pagination to handle large numbers of submissions.
- **FR-009**: The admin list view MUST allow clicking on an inquiry row to display its full details (including the message body) in a modal.
- **FR-010**: The details modal MUST allow the admin to update the inquiry status (Enum: "Unread", "Read", "Resolved") via a dropdown selection.
- **FR-011**: The `AdminNavbar` component MUST display a notification badge showing the current count of inquiries with "Unread" status, updated on page load/navigation using standard server-side/client-side data fetching (no Supabase Realtime subscriptions).
- **FR-012**: The system MUST NOT attempt to send any SMTP emails, auto-replies, or other external notifications for contact submissions. All inquiries must be kept strictly database-logged.
- **FR-013**: The contact form and database schema MUST be strictly general-purpose, containing only Full Name, Email, Subject, and Message fields; no dedicated pickup/destination route pricing fields or corresponding database columns shall be created.

### Key Entities *(include if feature involves data)*

- **Contact Inquiry**: Represents an inquiry submitted by a visitor. Key attributes:
  - `id` (Unique identifier)
  - `name` (Full name of the visitor)
  - `email` (Email address of the visitor)
  - `subject` (Subject of the message)
  - `message` (Full message text)
  - `status` (Enum: "Unread", "Read", "Resolved")
  - `created_at` (Timestamp of submission)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of valid contact form submissions are persisted to the database and initialized with "Unread" status.
- **SC-002**: The `/admin/inquiries` page loads and lists submissions in less than 1 second under normal network conditions.
- **SC-003**: The unread inquiries badge in `AdminNavbar` accurately reflects the database count of "Unread" submissions within standard page navigation/refreshes.
- **SC-004**: Form submission is blocked, and validation errors are shown client-side, for 100% of cases where inputs are empty or the email format is invalid.

## Assumptions

- The project relies on Next.js App Router and Supabase for database integration.
- The `AdminNavbar` is an existing component shared across admin pages.
- Standard admin authentication/session checks are already implemented and can be applied to the `/admin/inquiries` page.
- No SMTP or email integration is required for this feature.
- Unread inquiries badge count is fetched on-demand via Next.js standard data fetching on page load/navigation, not through realtime subscriptions.
- No custom route pricing fields are required on the contact form; all route details are input by customers via the standard message field.
