# Feature Specification: Pricing Management

**Feature Branch**: `003-pricing-management`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "Build Feature F-02: "Pricing Management" for the admin dashboard. The purpose is to allow administrators to set and manage trip prices based on specific pickup points and destinations.

Requirements:
1. Core Functionality: Create a system to define the cost of a trip from a "Pickup Location" to a "Destination Location".
2. Relational Integration: The pricing must strictly reference the "Locations" created in F-01. The add/edit forms must use dropdown menus dynamically populated only with "Active" locations.
3. Validation Constraints: Prevent the creation of duplicate pricing rules for the exact same pickup and destination pair (e.g., if Location A to Location B exists, prevent recreating it). Ensure the price is strictly a positive numeric value.
4. Admin UI: Create a clean data table in the admin dashboard showing "From", "To", "Price", and action buttons (Edit, Delete). Include forms (modal or separate page) to manage these route prices. Include basic pagination.
5. Goal: This pricing matrix will act as the core engine for the customer-facing booking wizard to instantly calculate the trip cost."

## Clarifications

### Session 2026-06-23
- Q: How should the pricing system support different vehicle classes? → A: Option C - Vehicle classes, car types, and multipliers are completely excluded from the project scope. The system will enforce a single flat price per route.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pricing Rules List View (Priority: P1)

Administrators need to view a comprehensive list of all defined trip pricing rules in a clean, paginated table format showing the pickup location name, destination location name, and price.

**Why this priority**: Highly critical for administration oversight. Provides the interface through which administrators locate, review, and manage route prices.

**Independent Test**: Can be tested by adding sample pricing rules, navigating to the admin pricing page, and verifying that the table successfully loads and displays the correct pickup location, destination location, and price.

**Acceptance Scenarios**:

1. **Given** there are more than 10 pricing rules in the database, **When** an administrator navigates to the Pricing Management view, **Then** they see a table displaying the first 10 pricing rules, showing "From" location, "To" location, and "Price" columns, with active pagination controls.
2. **Given** the list has multiple pages, **When** the administrator clicks the "Next Page" control, **Then** the table loads and displays the next set of pricing rules.
3. **Given** the list of pricing rules, **When** a route price references a location that has been deactivated, **Then** the UI displays a subtle indicator (e.g., "Inactive Location") next to the deactivated location name to flag the pricing rule as currently unusable.

---

### User Story 2 - Define / Create New Pricing Rule (Priority: P2)

Administrators need to define a new price for a trip from a specific pickup location to a destination location.

**Why this priority**: Required for seeding and expanding the pricing engine with route-specific rates so that bookings can be calculated.

**Independent Test**: Can be tested by opening the "Add Route Price" form, selecting an active pickup location and an active destination location, entering a valid positive price, and submitting the form to verify it persists and updates the list.

**Acceptance Scenarios**:

1. **Given** an administrator is on the Pricing Management view, **When** they click "Add Route Price", select Pickup Location "Dallas City Center" (Active) and Destination Location "DFW Airport" (Active), enter "55.00" as the Price, and save, **Then** the new pricing rule is stored, a success notification is shown, and the new route price appears in the table.
2. **Given** the "Add Route Price" form, **When** they attempt to save with an empty price or missing pickup/destination selections, **Then** the system highlights the missing fields, displays a validation error, and blocks submission.
3. **Given** a pricing rule for "Dallas City Center" to "DFW Airport" already exists, **When** they attempt to create another pricing rule for the exact same pickup and destination pair, **Then** the system displays a uniqueness validation error ("Pricing rule for this route already exists") and blocks creation.
4. **Given** the "Add Route Price" form, **When** they enter a non-positive price (e.g., "0" or "-15.00"), **Then** the system displays a validation error ("Price must be a positive number greater than zero") and blocks submission.
5. **Given** the location dropdowns in the form, **When** the administrator opens the Pickup or Destination dropdown, **Then** only locations with status "Active" are available for selection.

---

### User Story 3 - Modify / Edit Existing Pricing Rule (Priority: P2)

Administrators need to update the price or route locations of an existing pricing rule.

**Why this priority**: Critical for updating rates due to fuel costs, seasonal price changes, or correction of data entry errors.

**Independent Test**: Can be tested by selecting an existing pricing rule to edit, modifying its price or locations, saving, and verifying the updated details are saved and displayed correctly.

**Acceptance Scenarios**:

1. **Given** a pricing rule from "Dallas City Center" to "DFW Airport" exists with price "55.00", **When** the administrator edits the rule, updates the price to "65.00", and saves, **Then** the route price is updated in the database and the table displays "65.00".
2. **Given** a pricing rule for A to B exists and a pricing rule for C to D exists, **When** the administrator edits the A to B rule, changes the locations to C and D, and attempts to save, **Then** a uniqueness validation error is shown and the change is blocked.
3. **Given** the edit form, **When** the administrator cancels the edit, **Then** the original details are retained and they are returned to the list view without any changes.

---

### User Story 4 - Delete Pricing Rule (Priority: P3)

Administrators need to delete a pricing rule that is no longer offered or valid.

**Why this priority**: Keeps the pricing engine clean of obsolete rates.

**Independent Test**: Can be tested by selecting the delete option on a pricing rule, confirming the prompt, and verifying it is removed from the database and the table.

**Acceptance Scenarios**:

1. **Given** a pricing rule exists for "Houston" to "Hobby Airport", **When** the administrator clicks "Delete" and confirms the action, **Then** the pricing rule is permanently deleted and vanishes from the list.

---

### User Story 5 - Fetch Trip Price in Booking Wizard (Priority: P1)

The customer-facing booking wizard needs to query the pricing matrix to retrieve the cost of a trip for a selected pickup and destination location.

**Why this priority**: Core integration requirement. Allows instant, accurate pricing for customers booking a transfer.

**Independent Test**: Can be tested by sending a price query for an active pickup and destination pair, and verifying it returns the correct price.

**Acceptance Scenarios**:

1. **Given** a pricing rule from Pickup A to Destination B exists with price "80.00", **When** a customer selects Pickup A and Destination B in the booking wizard, **Then** the system instantly calculates and displays the trip cost as "80.00".
2. **Given** no direct pricing rule exists for the selected pickup and destination pair, **When** the customer selects this combination, **Then** the booking wizard displays a message indicating that online pricing is unavailable for this specific route and prompts them to contact support.

---

### Edge Cases

- **Deactivated Locations**: If an administrator deactivates a location (e.g., changes "Dallas City Center" status to Inactive), any pricing rule referencing it becomes temporarily inactive. The customer-facing booking wizard will exclude that location, preventing users from selecting the route, while the admin dashboard will show an "Inactive Location" warning next to the location name in the pricing table.
- **Same Pickup and Destination**: The system must prevent selecting the same location for both pickup and destination in the pricing rule (e.g., Pickup: Location A, Destination: Location A is invalid and blocked by form validation).
- **Directional Pricing**: Pricing rules are directional. A pricing rule for Location A -> Location B does not automatically create or apply to Location B -> Location A. If the price is the same in both directions, the administrator must define two separate pricing rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support CRUD (Create, Read, Update, Delete) operations for trip pricing rules.
- **FR-002**: The pricing rule schema MUST include:
  - `id`: Unique identifier
  - `pickup_location_id`: Reference to a Location entity (Foreign Key)
  - `destination_location_id`: Reference to a Location entity (Foreign Key)
  - `price`: Positive decimal number (greater than 0)
- **FR-003**: The system MUST enforce uniqueness on the combination of `pickup_location_id` and `destination_location_id` to prevent duplicate pricing rules for the exact same route.
- **FR-004**: The system MUST prevent setting the same location as both pickup and destination (`pickup_location_id` cannot equal `destination_location_id`).
- **FR-005**: The admin dashboard forms for adding and editing pricing rules MUST use dropdown menus dynamically populated only with locations having the status "Active".
- **FR-006**: The admin dashboard MUST display all pricing rules in a paginated list view with at least 10 items per page by default.
- **FR-007**: The customer-facing booking wizard MUST query this pricing rules matrix to instantly calculate the trip cost when a pickup and destination location are selected.

### Key Entities *(include if feature involves data)*

- **PricingRule**:
  - `id`: Unique identifier
  - `pickup_location_id`: Reference to the `Location` entity (representing the start of the trip)
  - `destination_location_id`: Reference to the `Location` entity (representing the end of the trip)
  - `price`: The cost of the trip (strictly positive decimal)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin dashboard pricing list views and pagination transitions load in under 500 milliseconds.
- **SC-002**: Customer booking wizard calculates and retrieves the route price in under 500 milliseconds upon selecting both pickup and destination.
- **SC-003**: 100% of inactive locations are filtered out from the pickup and destination selection dropdowns in the add/edit pricing forms.
- **SC-004**: 100% of duplicate route pricing creation attempts (same pickup and destination pair) are blocked with a validation message.
- **SC-005**: 100% of pricing rules with non-positive values (<= 0) are blocked.

## Assumptions

- **AS-001**: Pricing rules are strictly directional. Price(A -> B) is independent of Price(B -> A).
- **AS-002**: Deactivating a location does not automatically delete its associated pricing rules, but prevents customers from booking that route since the location itself is unavailable in the booking wizard.
- **AS-003**: All administrative endpoints, server-side code, and databases managing pricing rules are secured behind authentication and limited to users with administrator privileges.
- **AS-004**: Currency is uniform across the application (e.g., standard fiat currency defined at system level).
- **AS-005**: Vehicle classes, vehicle types, and pricing multipliers are completely excluded from the project scope; a single flat price is enforced per route.
