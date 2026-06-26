# Feature Specification: Bookings Dashboard

**Feature Branch**: `007-bookings-dashboard`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-06: "Bookings Management Dashboard" for the secure admin panel. The purpose is to allow administrators to view, manage, and process all customer reservation requests.

Requirements:
1. Core UI: A comprehensive responsive data table listing all customer bookings, sorted by newest first (`created_at` descending).
2. Data Display: The table should display the Booking Reference, Route (Pickup/Destination names), Date & Time, Customer Name, Final Price, and current Status.
3. Filtering & Pagination: Include server-side pagination and a filter to view bookings by their Status (e.g., Pending, Confirmed, Completed, Cancelled).
4. Booking Details & Status Update: Admins must be able to view the full details of a specific booking (including email, phone, flight number, and notes) via a modal or a details page. From there, admins can update the booking `status`.
5. Driver Assignment: Inside the booking details, admins must be able to assign an active driver (from the `drivers` table built in F-03) to the booking. 
6. Constraint: This dashboard is strictly for authenticated admins. Do not build any financial invoicing, billing, or payment collection interfaces. Keep it strictly focused on operational dispatching."

## Clarifications

### Session 2026-06-26

- **Q**: Are there restrictions on status transitions out of terminal states (Completed/Cancelled)?
  - **A**: Option A (Terminal Restriction: Block transitions out of Completed or Cancelled status. Once marked completed/cancelled, the status is locked).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View, Filter, and Paginate Bookings (Priority: P1)

Administrators need to view a comprehensive list of all customer reservation requests in a responsive data table, filter the view by booking status, and navigate through the requests using server-side pagination.

**Why this priority**: Core administrative view. Enables managers to monitor all reservation requests, observe current booking volumes, and quickly locate bookings by their operational status.

**Independent Test**: Can be verified by inserting several test bookings with different statuses and creation dates, navigating to the admin bookings page, checking that the table is ordered newest first, applying the status filter, and clicking pagination controls to see subsequent pages.

**Acceptance Scenarios**:

1. **Given** bookings exist in the database, **When** an administrator navigates to the bookings dashboard, **Then** they see a table displaying Booking Reference, Route (Pickup and Destination names), Date & Time, Customer Name, Price, and Status (with clear colored badges), sorted by the creation date descending.
2. **Given** the bookings filter is set to "All", **When** the administrator selects the "Pending" filter option, **Then** the table displays only bookings that are in the "Pending" status.
3. **Given** there are more than 10 bookings matching the current filter, **When** the administrator clicks the "Next" pagination button, **Then** the system fetches and displays the next 10 bookings.
4. **Given** a booking reference is displayed, **When** the administrator hovers or interacts with the reference, **Then** they can copy the full reference UUID to their clipboard.

---

### User Story 2 - View Booking Details and Update Status (Priority: P1)

Administrators need to view the full operational details of a specific booking—including customer contact information, flight number, and special notes—and update its status as it moves through the dispatch process.

**Why this priority**: Critical for operational workflow. Enables administrators to review passenger requirements, coordinate flight arrivals, and manually progress bookings (e.g., confirming, cancelling, or marking them as completed).

**Independent Test**: Can be verified by clicking a booking's details button, ensuring all details (email, phone, flight number, and special notes) are correctly rendered in the details view/modal, changing the status, saving, and verifying the status update is saved in the database and displayed in the main table.

**Acceptance Scenarios**:

1. **Given** an administrator is on the bookings dashboard, **When** they click "View Details" on a booking row, **Then** a modal or details view opens displaying Customer Email, Customer Phone, Flight Number (or "N/A" if none), and Special Notes (or "None" if none), in addition to the core route details.
2. **Given** the booking details modal is open, **When** the administrator selects a new status (e.g., "Confirmed") from the status dropdown and clicks save, **Then** the status is updated in the database, a success message is displayed, and the table updates the status badge.
3. **Given** the details modal is open, **When** the administrator clicks "Close" or "Cancel", **Then** the modal closes and no changes are saved to the database.

---

### User Story 3 - Assign Driver to Booking (Priority: P2)

Administrators need to assign an active driver to a booking from the fleet database so that trips can be dispatched to specific drivers.

**Why this priority**: Core dispatch function. Establishes the relationship between a customer booking and the service provider (driver).

**Independent Test**: Can be verified by opening the details of a booking, selecting an active driver from the driver assignment dropdown, saving, and verifying that the assignment is persisted and visible in the booking details.

**Acceptance Scenarios**:

1. **Given** the booking details modal is open, **When** the administrator opens the driver assignment dropdown, **Then** they see a list of active drivers, displaying their name and availability status.
2. **Given** the administrator selects a driver and clicks save, **Then** the driver is associated with that booking, and the booking details show the assigned driver's name.
3. **Given** a booking has an assigned driver, **When** the administrator opens the details modal, they can select "Unassigned" from the driver list and click save, **Then** the driver assignment is removed from the booking.

---

### Edge Cases

- **Driver Deletion**: If a driver is deleted from the system (e.g., leaving the fleet) while assigned to a booking, the system must set the booking's driver assignment to "Unassigned" (null) without breaking or deleting the booking record itself.
- **No Available Drivers**: If all drivers are busy or inactive, the driver assignment dropdown should still allow selecting "Busy" drivers (for queueing) but should indicate their busy status clearly.
- **Database Status Constrains**: The existing database constraint on booking status only allows 'Pending', 'Confirmed', and 'Cancelled'. The system must expand this check constraint to support the 'Completed' status.
- **Unauthorized Access**: If an unauthenticated user attempts to access `/admin/bookings` or invoke booking actions, the server must block the request and redirect the user to the login/landing page.
- **Terminal Status Modification**: Once a booking reaches a terminal status ('Completed' or 'Cancelled'), the dashboard must disable status controls and driver assignment fields, preventing any further updates to the record.


## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST restrict access to the Bookings Dashboard (`/admin/bookings`) to authenticated administrators only.
- **FR-002**: The bookings table MUST display the following information for each booking:
  - Booking Reference (shortened UUID format with a copy button)
  - Route (Pickup Location Name to Destination Location Name)
  - Date & Time (formatted clearly, e.g., YYYY-MM-DD HH:MM)
  - Customer Name
  - Final Price (with appropriate currency symbol formatting)
  - Booking Status
- **FR-003**: The bookings table MUST sort entries by creation date descending (`created_at` descending) by default to show the newest bookings first.
- **FR-004**: The system MUST support server-side pagination with a default size of 10 items per page.
- **FR-005**: The system MUST support status filtering (All, Pending, Confirmed, Completed, Cancelled) to filter the list of bookings server-side.
- **FR-006**: The system MUST provide a details view (e.g., modal) displaying the booking's full customer details:
  - Full Name
  - Customer Email
  - Customer Phone
  - Flight Number (if provided)
  - Special Notes/Comments (if provided)
- **FR-007**: Administrators MUST be able to update a booking's status from the details view. Allowed values MUST include: "Pending", "Confirmed", "Completed", and "Cancelled". The system MUST block status transitions out of "Completed" or "Cancelled" terminal states. Once a booking is marked completed or cancelled, its status is locked and cannot be transitioned back to "Pending" or "Confirmed".
- **FR-008**: Administrators MUST be able to assign an active driver to a booking from the details view.
- **FR-009**: The driver dropdown list MUST load drivers dynamically from the drivers database table.
- **FR-010**: The database schema for `bookings` MUST be updated to add a nullable `driver_id` column referencing the `drivers` table (`ON DELETE SET NULL`).
- **FR-011**: The database schema for `bookings` MUST update the status check constraint to support `'Completed'`.
- **FR-012**: Financial invoicing, billing, or payment collection interfaces are strictly out of scope for this dashboard.
- **FR-013**: The booking details interface MUST disable editing controls (such as status selection and driver assignment fields) for bookings that are in a terminal state ("Completed" or "Cancelled").


### Key Entities

- **Booking**:
  - `id`: Unique internal identifier (UUID)
  - `booking_reference`: Secure public lookup reference (UUID)
  - `pickup_location_id`: Pickup location reference (UUID, foreign key to locations)
  - `destination_location_id`: Destination location reference (UUID, foreign key to locations)
  - `booking_date`: Scheduled date (DATE)
  - `booking_time`: Scheduled time (TIME)
  - `price`: Final route cost (NUMERIC)
  - `customer_name`: Passenger name (TEXT)
  - `customer_email`: Passenger email (TEXT)
  - `customer_phone`: Passenger phone (TEXT)
  - `flight_number`: Flight identifier (TEXT, optional)
  - `notes`: Custom remarks (TEXT, optional)
  - `status`: Operational status (TEXT, enum: "Pending", "Confirmed", "Completed", "Cancelled")
  - `driver_id`: Assigned driver (UUID, nullable, foreign key to drivers)
  - `created_at`: Creation timestamp (TIMESTAMP WITH TIME ZONE)

- **Driver**:
  - `id`: Driver identifier (UUID)
  - `name`: Full name (TEXT)
  - `phone`: Contact number (TEXT)
  - `availability_status`: Fleet status (TEXT, enum: "Available", "Busy", "Inactive")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The admin bookings page renders lists, executes status filtering, and processes pagination in under 500 milliseconds.
- **SC-002**: 100% of driver assignments and status updates are saved successfully in the database and reflected in the UI upon completion.
- **SC-003**: 100% of unauthenticated attempts to view the dashboard or trigger booking server actions are blocked and redirected to the login/landing page.
- **SC-004**: The bookings table correctly maps all four statuses to distinct color-coded badges (e.g. Yellow for Pending, Blue/Indigo for Confirmed, Green for Completed, Red for Cancelled) 100% of the time.

## Assumptions

- **AS-001**: Administrative accounts are managed via the existing Supabase Auth integration, and session validation is handled on the server side.
- **AS-002**: The `drivers` and `locations` tables are populated and operational.
- **AS-003**: Email confirmation notifications for status updates (e.g., notifying the guest when status changes to Confirmed/Cancelled) are out of scope for this phase unless specified.
- **AS-004**: No financial processing or invoicing views/controls will be included.
