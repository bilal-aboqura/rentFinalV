# Feature Specification: Status Change Alert

**Feature Branch**: `009-status-change-alert`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-09: 'Status Change Alert' for the notification system. The purpose is to automatically notify the guest customer via email when their booking status is updated by an administrator.

Requirements:
1. Core Mechanism: Hook into the existing `updateBookingStatusAction` (built in F-06) to trigger asynchronous email notifications when a booking's status is changed.
2. Delivery Channel: Utilize the existing SMTP helper (`smtp.ts`) to send transactional emails directly to the `customer_email` associated with the booking.
3. Content (Confirmed Status): When a booking is marked as "Confirmed", the email must include a success message, the Booking Reference, trip details, and the assigned Driver's Name and Phone Number (joined from the `drivers` table).
4. Content (Cancelled Status): When a booking is marked as "Cancelled", the email must politely inform the customer of the cancellation.
5. Strict Constraint: Since drivers only have phone numbers and third-party SMS APIs are strictly out of scope, ALL notifications MUST be restricted to Customer Emails only. Do not attempt to implement SMS, push notifications, or driver-side alerts."

## Clarifications

### Session 2026-06-26

- Q: Should the confirmation email be triggered only on the status change to "Confirmed", or should it also trigger when a driver is assigned/updated on a booking that is already confirmed? → A: Trigger on status transition to "Confirmed" AND when a driver is assigned/updated on a booking already in "Confirmed" status.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Email Notification on Booking Confirmation (Priority: P1)

As a guest customer, when an administrator confirms my booking, I want to receive an email notification containing my booking details, trip info, and driver name and phone number, so that I know my ride is confirmed and who my driver is.

**Why this priority**: It is the core requirement for F-09 to notify customers of booking confirmations and provide details of their assigned driver.

**Independent Test**: Update a booking status to "Confirmed" in the admin dashboard and verify that a confirmation email is dispatched via SMTP to the customer email address with the correct details.

**Acceptance Scenarios**:

1. **Given** a booking in "Pending" status with an assigned driver, **When** the administrator updates the status to "Confirmed" via the bookings dashboard, **Then** an email is asynchronously sent to the customer's email containing a success message, the Booking Reference, pickup/destination locations, date/time, price, and the assigned driver's name and phone number.
2. **Given** a booking in "Pending" status without an assigned driver, **When** the administrator updates the status to "Confirmed" via the bookings dashboard, **Then** an email is asynchronously sent to the customer's email containing all booking details, with driver details indicating that a driver will be assigned soon.
3. **Given** a booking in "Confirmed" status, **When** the administrator assigns or updates the driver via the bookings dashboard, **Then** an email is asynchronously sent to the customer's email containing a confirmation message with the updated driver's name and phone number.

---

### User Story 2 - Email Notification on Booking Cancellation (Priority: P2)

As a guest customer, when an administrator cancels my booking, I want to receive a polite email informing me of the cancellation, so that I know my ride has been cancelled.

**Why this priority**: Essential to keep the customer updated when their reservation cannot be fulfilled, avoiding confusion.

**Independent Test**: Update a booking status to "Cancelled" in the admin dashboard and verify that a cancellation email is dispatched to the customer's email address.

**Acceptance Scenarios**:

1. **Given** a booking in "Pending" or "Confirmed" status, **When** the administrator updates the status to "Cancelled", **Then** an email is asynchronously sent to the customer's email politely informing them of the cancellation along with the Booking Reference.

---

### Edge Cases

- What happens when the customer's email address is invalid or the SMTP server is unreachable?
  - The system must catch the error and log it, ensuring that the database transaction for the booking status update completes successfully without failing the admin's request.
- What happens when a booking transitions to "Completed" or "Pending"?
  - No email notification should be sent for status changes to "Completed" or "Pending".
- What happens if the driver's phone number or name is missing or the driver record is deleted?
  - The system must handle missing driver details gracefully by omitting them or using clear placeholders in the "Confirmed" email, ensuring the mail is still successfully sent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST trigger asynchronous email notifications when a booking's status is changed using `updateBookingStatusAction` to "Confirmed" or "Cancelled".
- **FR-002**: The email notifications MUST be sent to the customer's email address (`customer_email`) saved in the booking record.
- **FR-003**: The system MUST use the existing SMTP helper (`smtp.ts`) to send emails.
- **FR-004**: When the booking status is changed to "Confirmed", the email sent MUST include the booking reference, pickup location name, destination location name, booking date, booking time, price, customer name, and the assigned driver's name and phone number (joined from the `drivers` table).
- **FR-005**: When the booking status is changed to "Cancelled", the email sent MUST include a polite cancellation message and the booking reference.
- **FR-006**: Status transitions to "Completed" or "Pending" MUST NOT trigger any email notification.
- **FR-007**: If email sending fails (e.g., due to SMTP network errors), the status update transaction in the database MUST still complete successfully, and the error MUST be logged.
- **FR-008**: Driver details MUST NOT be included or attempted to be fetched if no driver is assigned (i.e. `driver_id` is null). The email should state that driver details will be provided later.
- **FR-009**: The system MUST NOT attempt to send SMS, push notifications, or driver-side alerts. All notifications are strictly restricted to the customer's email.
- **FR-010**: The system MUST trigger an asynchronous confirmation email notification when a driver is assigned or updated via `assignDriverAction` on a booking that is already in "Confirmed" status.

### Key Entities *(include if feature involves data)*

- **Booking**: Represents a customer reservation. Attributes include: ID, Booking Reference, Pickup Location Name, Destination Location Name, Booking Date, Booking Time, Price, Customer Name, Customer Email, Customer Phone, Flight Number, Notes, Status, Driver ID.
- **Driver**: Represents the assigned driver. Attributes include: ID, Name, Phone, Availability Status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successful booking status transitions to "Confirmed" or "Cancelled" trigger an email dispatch attempt to the correct customer email address.
- **SC-002**: Driver details (Name and Phone) are correctly populated in the confirmation email when a driver is assigned.
- **SC-003**: Network or SMTP server failures do not block or rollback booking status updates in the database.
- **SC-004**: Email dispatch does not introduce visible latency to the administrator updating the status (asynchronous or non-blocking execution).

## Assumptions

- The system has access to valid SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) for email sending.
- Admin status updates are executed using `updateBookingStatusAction` server action.
- The `drivers` table is already populated and holds correct names and phone numbers.
- Guest customer emails are recorded in the `bookings` table as `customer_email`.
- SMS notifications and driver-side alerts are completely out of scope.
