# Feature Specification: New Request Alert

**Feature Branch**: `008-new-request-alert`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-08: "New Request Alert" for the admin notification system. The purpose is to instantly alert administrators when a new booking request is submitted by a customer.

Requirements:
1. Core Mechanism: Hook into the existing `submitBookingAction` (built in F-05) to trigger an administrative alert upon successful database insertion.
2. Delivery Channel: Utilize the existing SMTP helper (`smtp.ts`) to send a formatted "New Booking Request" email to a designated admin email address.
3. Content: The email must include key details: Booking Reference, Route (Pickup/Destination), Date, Time, Customer Name, and a direct link to the specific booking details in the admin dashboard (e.g., `/admin/bookings?ref=[UUID]`).
4. UI Indicator: In the Admin Dashboard header/sidebar, display a simple visual indicator (e.g., a badge with a count) representing the number of currently "Pending" bookings.
5. Constraint: Do not introduce complex third-party real-time websocket services (like Pusher or Socket.io) or SMS integrations. Stick to server-side SMTP and simple database querying to maintain a lightweight infrastructure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrator Email Alerts (Priority: P1)

Administrators receive an immediate email notification when a customer submits a new booking, allowing them to review key details quickly.

**Why this priority**: Crucial for operational awareness, allowing administrators to act on new incoming booking requests immediately.

**Independent Test**: A customer completes the booking wizard and submits a booking request. The database registers the booking, and an email is dispatched to the admin containing the reference, pickup location, destination, date, time, customer name, and a link to the booking details in the admin dashboard.

**Acceptance Scenarios**:

1. **Given** a customer successfully submits a booking request, **When** the booking is saved to the database, **Then** an email is sent to the configured admin email address.
2. **Given** the admin receives the email, **When** the admin reviews the email body, **Then** it displays the correct Booking Reference, Pickup/Destination locations, Date, Time, Customer Name, and a hyperlink formatted as `/admin/bookings?ref=[UUID]`.

---

### User Story 2 - Pending Bookings Badge in Admin Dashboard (Priority: P2)

Administrators see a clear visual count of all currently pending booking requests in the admin dashboard navigation area, helping them stay aware of outstanding items.

**Why this priority**: Improves administrative efficiency by providing a visual reminder of items requiring attention directly within the user interface.

**Independent Test**: An administrator logs in and opens the admin dashboard. The sidebar or header displays a badge with a count matching the total number of bookings in "Pending" status. Clicking the badge or dashboard links loads the booking management page.

**Acceptance Scenarios**:

1. **Given** there are pending bookings in the system, **When** the administrator navigates to any admin dashboard page, **Then** the header or sidebar displays a badge with the exact count of pending bookings.
2. **Given** a pending booking is approved, cancelled, or rejected (changing its status from "Pending"), **When** the administrator refreshes or navigates the dashboard, **Then** the badge count decreases accordingly.
3. **Given** there are zero pending bookings, **When** the administrator views the dashboard, **Then** the badge count displays 0 or the badge is not rendered.

---

### Edge Cases

- **SMTP Server Timeout or Failure**: If the SMTP server is down or timing out, the customer's booking confirmation and database insertion must still complete successfully. The system should handle the email exception, log the failure for troubleshooting, and avoid displaying any error to the customer.
- **Admin Email Not Set**: If the administrator email address is not configured in the environment settings, the system should log a warning to the console/system logs and complete the booking submission without throwing an unhandled exception.
- **Rapid Submissions (Spam/Concurrency)**: If multiple bookings are submitted simultaneously, the system must process them sequentially or concurrently without database deadlock, sending an email alert for each and incrementing the pending count accurately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically trigger an administrative email alert upon successful database insertion of a new booking request.
- **FR-002**: The administrative email alert MUST be sent to a designated administrator email address configured in the system environment variables.
- **FR-003**: The email alert content MUST include the booking reference (UUID), pickup location name, destination location name, booking date, booking time, customer name, and a direct URL hyperlink pointing to the specific booking's details page in the Admin Dashboard (formatted as `/admin/bookings?ref=[UUID]`).
- **FR-004**: System MUST handle administrative email dispatch failures gracefully (non-blocking) so that failures do not interrupt the customer's booking flow or response.
- **FR-005**: System MUST display a visual badge indicator in the Admin Dashboard header or sidebar showing the current total count of bookings with "Pending" status.
- **FR-006**: The pending bookings count displayed in the badge MUST be queried directly from the active bookings database schema.
- **FR-007**: The dashboard count badge MUST update on every page load or navigation within the admin panel.

### Key Entities *(include if feature involves data)*

- **Booking**: Represents a customer reservation request. Attributes involved: booking reference, pickup location, destination location, booking date, booking time, customer name, and status (which is set to 'Pending' initially).
- **Admin Configuration**: System settings defining the administrator email address for receiving notifications.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin notification email is dispatched within 3 seconds of a booking request being successfully persisted.
- **SC-002**: 100% of successfully persisted bookings trigger an admin notification dispatch attempt.
- **SC-003**: A failure in the SMTP notification flow causes 0% disruption to the passenger checkout flow.
- **SC-004**: The admin dashboard header/sidebar displays the correct count of pending bookings, matching the database count, 100% of the time on page load.

## Assumptions

- **AS-001**: An existing SMTP server configuration is already set up and accessible by the application server.
- **AS-002**: The admin dashboard has a common header or sidebar component shared across admin pages where the badge can be integrated.
- **AS-003**: No real-time updates (e.g. web sockets) are required for the count badge; standard page transitions and revalidation are sufficient.
- **AS-004**: The administrator email address is configurable via standard environment variables.
