# Feature Specification: Drivers Management

**Feature Branch**: `004-drivers-management`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "Build Feature F-03: "Drivers Management" for the admin dashboard. The purpose is to allow administrators to manage the fleet of drivers and track their availability status.

Requirements:
1. Core Functionality: Implement full CRUD (Create, Read, Update, Delete) operations for a "Drivers" entity.
2. Driver Attributes: Each driver must have a `name`, a `phone` number, and an `availability_status` (enum: "Available", "Busy", "Inactive").
3. Admin UI: Create a dedicated page with a responsive data table listing all drivers. Include clear visual indicators (badges) for their availability status. Provide forms (modal or separate page) to add and edit drivers. Include basic pagination and search by name or phone.
4. Validation Constraints: Ensure the driver's phone number is strictly unique to prevent duplicate entries.
5. Goal: This driver list will be utilized later in the booking management phase to assign "Available" drivers to confirmed trips."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drivers List View, Search, and Pagination (Priority: P1)

Administrators need to view a comprehensive list of all drivers in a responsive table, search for specific drivers by name or phone, and navigate through the fleet list using pagination.

**Why this priority**: Core administrative view. Enables managers to check the active fleet size, find individual drivers, and observe their current availability status.

**Independent Test**: Can be verified by adding several test drivers, opening the drivers page, validating that all details are displayed correctly with corresponding colored badges, searching by a driver's name or phone, and using pagination to see more records.

**Acceptance Scenarios**:

1. **Given** there are drivers in the database, **When** an administrator navigates to the Drivers page, **Then** they see a table displaying Name, Phone, and Availability Status (with clear colored badges) for each driver, along with Edit and Delete actions.
2. **Given** the driver search input is focused, **When** the administrator types a query matching a driver's name (e.g. "John"), **Then** the table dynamically updates to show only drivers whose name contains "John" (case-insensitive).
3. **Given** the driver search input is focused, **When** the administrator types a query matching a driver's phone number (e.g. "555-01"), **Then** the table dynamically updates to show only drivers whose phone number contains "555-01".
4. **Given** there are more than 10 drivers registered, **When** the page loads, **Then** the first 10 drivers are shown, and clicking the "Next" pagination button loads the next page of drivers.

---

### User Story 2 - Add New Driver (Priority: P1)

Administrators need to register a new driver with their name, a unique phone number, and their initial availability status.

**Why this priority**: Required to register new personnel into the fleet database so they can eventually be assigned to trips.

**Independent Test**: Can be verified by opening the "Add Driver" form, entering valid information, submitting, and confirming that the driver is added to the database and appears in the list view.

**Acceptance Scenarios**:

1. **Given** an administrator is on the Drivers page, **When** they click "Add Driver", enter Name "Alice Smith", Phone "+15550100200", select Status "Available", and click save, **Then** the driver record is stored, a success notification appears, the modal closes, and Alice Smith is displayed in the drivers list.
2. **Given** the "Add Driver" form, **When** the administrator attempts to save with an empty name or empty phone number, **Then** the system highlights the missing fields, displays validation error messages (e.g., "Name is required"), and blocks the submission.
3. **Given** a driver with phone number "+15550100200" already exists in the system, **When** the administrator attempts to create another driver with the exact same phone number "+15550100200", **Then** the system displays a uniqueness validation error ("Driver with this phone number is already registered") and blocks creation.
4. **Given** the "Add Driver" form, **When** the administrator views the status field, **Then** it presents options for "Available", "Busy", and "Inactive", defaulting to "Available".

---

### User Story 3 - Edit Existing Driver (Priority: P2)

Administrators need to update a driver's name, phone number, and availability status as their contact details or operational status change.

**Why this priority**: Critical for updating driver availability (e.g., switching to "Busy" when on a trip, or "Inactive" when off-duty) and correcting spelling/formatting errors.

**Independent Test**: Can be verified by selecting a driver, clicking "Edit", changing their name, phone, or status, submitting, and verifying that the updated driver details are persisted in the database and visible on the page.

**Acceptance Scenarios**:

1. **Given** a driver exists with name "Alice Smith" and status "Available", **When** the administrator edits the record, changes the status to "Busy", and saves, **Then** the status is updated to "Busy" in the database and the table shows the updated status badge.
2. **Given** a driver exists with phone number "+15550100333", **When** the administrator edits another driver and changes their phone number to "+15550100333", **Then** the system displays a duplicate phone validation error and blocks the update.
3. **Given** the "Edit Driver" form is open, **When** the administrator clicks "Cancel" or closes the modal, **Then** the original details are retained without modification and they are returned to the drivers list view.

---

### User Story 4 - Delete Driver (Priority: P3)

Administrators need to remove a driver from the system when they are no longer part of the fleet.

**Why this priority**: Allows maintaining a clean, up-to-date driver roster.

**Independent Test**: Can be verified by choosing a driver, clicking "Delete", confirming the prompt, and verifying the driver is removed from the database and vanishes from the admin table.

**Acceptance Scenarios**:

1. **Given** a driver exists in the database, **When** the administrator clicks "Delete" for that driver and confirms the confirmation prompt, **Then** the driver is deleted and the record is instantly removed from the UI table.

---

### Edge Cases

- **Phone Number Normalization**: Administrators might input phone numbers in different formats (e.g., `+1 (555) 123-4567` vs `+15551234567`). The system must normalize phone numbers (e.g., stripping spaces, parentheses, and dashes, leaving only digits and an optional leading `+`) before validation and storage to ensure uniqueness is checked reliably.
- **Reference Integrity (Future Bookings)**: While bookings are out of scope for this feature phase, in the future, active bookings will reference driver records. For this phase, driver deletion is a direct hard delete. In the future, if database integrity checks (foreign keys) prevent deletion of active drivers, the admin will be prompted to set the driver's status to "Inactive" instead of deleting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support CRUD (Create, Read, Update, Delete) operations for the "Driver" entity.
- **FR-002**: The Driver entity schema MUST contain:
  - `id`: Unique identifier (UUID, auto-generated)
  - `name`: Text (minimum 2 characters, maximum 100 characters, required)
  - `phone`: Text (strictly unique, normalized format, required)
  - `availability_status`: Enum ("Available", "Busy", "Inactive", required)
- **FR-003**: The system MUST enforce phone number uniqueness constraints at the database level (unique index) and validate this uniqueness in application code (Zod schema and backend validation) before saving.
- **FR-004**: The system MUST provide an admin dashboard interface showing all drivers in a responsive data table.
- **FR-005**: The drivers table MUST include:
  - A search input allowing case-insensitive filtering of drivers by name or phone.
  - Basic pagination supporting a default of 10 items per page.
  - Distinct colored badges indicating availability: "Available" (Green), "Busy" (Yellow/Orange), "Inactive" (Red/Gray).
- **FR-006**: The admin dashboard MUST provide forms (modal dialogs are preferred) for adding and editing drivers.
- **FR-007**: Forms MUST validate that the phone number is provided, has a valid length, and complies with standard phone number formats.

### Key Entities *(include if feature involves data)*

- **Driver**:
  - `id`: Unique identifier (UUID)
  - `name`: Driver's full name (text)
  - `phone`: Driver's contact number (text, unique and normalized)
  - `availability_status`: Status of the driver's availability (enum: "Available", "Busy", "Inactive")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The admin drivers table page, searches, and pagination requests render results in under 500 milliseconds.
- **SC-002**: 100% of driver addition/edit attempts with duplicate phone numbers are blocked and display a clear UI validation error.
- **SC-003**: The drivers table correctly maps all three availability states to their corresponding color-coded badges (Green, Yellow/Orange, Red/Gray) 100% of the time.
- **SC-004**: Form validation blocks 100% of empty names or invalid phone submissions at the client-side level before contacting the server.

## Assumptions

- **AS-001**: Administrative pages, endpoints, and server actions are restricted strictly to authorized administrators.
- **AS-002**: Phone numbers are normalized (stripping non-alphanumeric spacing/formatting characters) before uniqueness checking and storage.
- **AS-003**: In the future booking assignment phase, only drivers with the status "Available" will be eligible to be assigned to new bookings.
- **AS-004**: Hard deletion is allowed in this phase. Database constraints will prevent deleting drivers in the future if they are assigned to active bookings, forcing administrators to mark them as "Inactive".
