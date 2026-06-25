# Feature Specification: Booking Wizard (Step 1: Route & Time)

**Feature Branch**: `005-booking-wizard-step1`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-04: "Booking Wizard (Step 1: Route & Time)" for the customer-facing web application. The purpose is to allow customers to initiate a booking by selecting their desired route and schedule.

Requirements:
1. Core UI: Create a highly responsive, mobile-first booking form component.
2. Input Fields:
   - Pickup Location: Dropdown populated only with "Active" locations.
   - Destination Location: Dropdown populated only with "Active" locations.
   - Date: Date picker. Must strictly disable past dates. Implement a minimum 2-hour lead time buffer for same-day bookings.
   - Time: Time input/picker.
3. Dynamic Validation & Pricing Integration: 
   - The UI MUST prevent the customer from selecting the exact same location for both Pickup and Destination.
   - Once both locations are selected, dynamically query the pricing matrix (from F-02). 
   - If a valid price exists, display it clearly. If no price is defined for that route, disable the "Next" button and display a polite message directing the user to use the Contact Form.
4. State Persistence: Capture the validated trip parameters using standard React state or React Context so they can be securely passed to the next feature (Step 2: Trip Details Form). Do not use messy URL search parameters for state.
5. Goal: Ensure a frictionless, validated step 1 experience for the customer before collecting personal details."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Route Selection and Validation (Priority: P1)

Customers can select distinct pickup and destination locations from a list of active locations, and the system prevents selecting identical locations.

**Why this priority**: Core functionality for establishing a valid route, preventing invalid input before proceeding.

**Independent Test**: Can be fully tested by selecting "Airport" as Pickup and "City Center" as Destination. If both are selected, the route is accepted. Selecting the same location for both triggers an immediate validation warning and disables proceeding.

**Acceptance Scenarios**:

1. **Given** the customer booking wizard page is loaded, **When** the customer opens the pickup or destination location dropdown, **Then** only active locations are visible, categorized by type (Cities, Airports, Pickup Points) and sorted alphabetically within each group.
2. **Given** a pickup location is selected, **When** the customer selects the exact same location for the destination, **Then** the system displays a validation error and prevents the selection or disables proceeding.

---

### User Story 2 - Dynamic Pricing Lookup (Priority: P2)

Once a valid pickup and destination are selected, the system retrieves and displays the price, or displays a contact message if no pricing exists.

**Why this priority**: Crucial for customer transparency and self-service booking.

**Independent Test**: Selecting a valid route with a defined price displays the price and enables the Next button. Selecting a route without a defined price disables the Next button and shows a message directing the user to the contact form.

**Acceptance Scenarios**:

1. **Given** a valid pickup and destination location are selected, **When** a price is defined for that route in the pricing matrix, **Then** the price is displayed to the user, and the "Next" button is enabled.
2. **Given** a valid pickup and destination location are selected, **When** no price is defined for that route in the pricing matrix, **Then** the "Next" button is disabled, and a polite message directs the user to use the Contact Form.

---

### User Story 3 - Schedule and Buffer Selection (Priority: P3)

Customers can select a future date and time, with past dates disabled and a minimum 2-hour lead time buffer for same-day bookings.

**Why this priority**: Prevents last-minute or retrospective bookings that cannot be fulfilled.

**Independent Test**: A customer attempts to book a trip. All past dates are disabled in the date picker. For today's date, times less than 2 hours from now are disabled or rejected upon validation.

**Acceptance Scenarios**:

1. **Given** the customer booking wizard is open, **When** selecting a date, **Then** all dates prior to the current date are disabled.
2. **Given** today's date is selected, **When** the customer selects a time less than 2 hours from the current system time, **Then** the system displays a validation error and prevents proceeding.
3. **Given** today's date is selected, **When** the customer selects a time 2 hours or more in the future, **Then** the selection is validated and accepted.

### Edge Cases

- **Same-Day Midnight Boundary**: If a user attempts to book same-day travel at 11:00 PM, the 2-hour buffer pushes the minimum valid time to 1:00 AM the next day. The date picker must update or validate that the booking is made for the next day instead.
- **Offline / Network Latency on Pricing Lookup**: If the pricing lookup fails due to a temporary network issue or server timeout, the UI should display a user-friendly error message allowing retry, rather than assuming no price exists and disabling the flow permanently.
- **Location Status Updates**: If an admin deactivates a location while a customer is in the middle of filling out Step 1, the wizard must validate the locations upon submission and display an appropriate message if a selected location is no longer active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display separate dropdown fields for Pickup Location and Destination Location.
- **FR-002**: Location dropdowns MUST only display locations with active status set to true, grouped by type (Cities, Airports, Pickup Points) and sorted alphabetically within groups.
- **FR-003**: System MUST validate that Pickup Location and Destination Location are not the same location, displaying a clear validation message if they are.
- **FR-004**: System MUST query the pricing matrix upon selection of both locations. If a price exists, the price MUST be shown in a clear, formatted price display.
- **FR-005**: If no price exists in the pricing matrix for the selected route, the system MUST disable the "Next" button and display a polite message directing the user to use the Contact Form by redirecting them to the dedicated `/contact` page.
- **FR-006**: System MUST provide a date input field that disables all past dates relative to the current local date.
- **FR-007**: System MUST provide a time input field.
- **FR-008**: System MUST enforce a minimum 2-hour lead time buffer for same-day bookings. Same-day lead time MUST be calculated using the central system/server local operational time zone as the single source of truth.
- **FR-009**: System MUST persist the validated step 1 parameters (pickup location, destination location, date, time, price) in application state for use in subsequent steps.

### Key Entities *(include if feature involves data)*

- **Location**: Represents a geographic pickup or drop-off point. Attributes: name, type, active status.
- **Route Price**: Represents the established pricing between two distinct locations. Attributes: pickup location, destination location, price.
- **Booking State**: Represents the customer's in-progress booking details. Attributes: selected pickup location, selected destination location, booking date, booking time, retrieved price.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customer can select a route and schedule, validate pricing, and proceed to Step 2 in under 1 minute.
- **SC-002**: 100% of invalid routes (same pickup/destination) or invalid schedules (past dates, same-day under 2 hours buffer) are blocked at the user interface level with clear feedback.
- **SC-003**: 100% of bookings without an online price defined are prevented from proceeding, with a message directing them to the contact form.

## Assumptions

- **AS-001**: Locations and route prices are pre-configured in the system database.
- **AS-002**: The customer's device has internet connectivity to perform live pricing lookups and fetch active locations.
- **AS-003**: Step 2 of the booking wizard is designed to receive and process the persisted Step 1 data.
- **AS-004**: Responsive design supports mobile, tablet, and desktop viewports out of the box.
