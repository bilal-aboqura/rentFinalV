# Feature Specification: Cities & Airports Management

**Feature Branch**: `002-locations-management`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "Build the "Cities & Airports Management" feature for the admin dashboard. The purpose of this feature is to allow administrators to define and manage the geographical areas and specific points where the transfer service operates. 

Requirements:
1. CRUD Operations: Implement Create, Read, Update, and Delete functionality for "Locations".
2. Location Attributes: Each location must have a Name, a Type (enum: "City", "Airport", or "Pickup Point"), and a Status (Active/Inactive).
3. Single Language: Stick to a single language field for names as multi-language support is strictly out of scope.
4. Admin UI: Create a user-friendly table in the admin dashboard to list all locations, complete with basic search and pagination. Include forms for adding and editing locations.
5. Goal: These managed locations will serve as the source of truth for the dropdown menus in the customer-facing booking wizard. Only "Active" locations should be fetched for the customer UI."

## Clarifications

### Session 2026-06-23
- Q: How should active locations be organized and displayed in the customer-facing booking wizard dropdowns? → A: Grouped by type (Cities, Airports, Pickup Points) inside the dropdowns.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Locations List View with Search & Pagination (Priority: P1)

Administrators need to view a comprehensive list of all locations (cities, airports, pickup points) in a paginated table format, with the ability to perform basic name searches.

**Why this priority**: Highly critical for administration oversight. Provides the interface through which administrators locate records to modify or delete.

**Independent Test**: Can be tested by adding sample locations to the database, navigating to the admin locations page, verifying that the list loads and handles pagination (e.g., page 1, page 2), and searching for a specific location matches only the intended results.

**Acceptance Scenarios**:

1. **Given** there are more than 10 locations in the system, **When** an administrator navigates to the Locations Management view, **Then** they see a table displaying the first 10 locations and functional pagination controls.
2. **Given** locations with names "Dallas/Fort Worth Airport" and "Austin City" exist, **When** the administrator enters "DFW" or "Dallas" in the search input, **Then** the list filters to display only "Dallas/Fort Worth Airport".
3. **Given** a search query is active, **When** the administrator clears the search input, **Then** the table returns to displaying the full paginated list.

---

### User Story 2 - Define / Create New Location (Priority: P2)

Administrators need to add new locations (with a name, type, and active status) to expand the service areas.

**Why this priority**: Required for seeding new operational locations for the transfer service.

**Independent Test**: Can be tested by opening the "Add Location" form/modal, entering a name, selecting a type ("City", "Airport", or "Pickup Point"), choosing a status ("Active" or "Inactive"), and submitting the form to verify it persists and updates the list.

**Acceptance Scenarios**:

1. **Given** an administrator is on the Locations Management view, **When** they click "Add Location", fill the name with "Boston Logan Airport", select Type "Airport", Status "Active", and save, **Then** a new location is stored, a success notification is shown, and the new location appears in the table.
2. **Given** the "Add Location" form, **When** they attempt to save with an empty name field, **Then** the system highlights the name field, displays a validation error, and blocks submission.
3. **Given** a location with name "Miami" already exists, **When** they attempt to create another location named "Miami", **Then** the system displays a "Name must be unique" validation error.

---

### User Story 3 - Modify / Edit Existing Location (Priority: P2)

Administrators need to modify the name, type, or status of an existing location.

**Why this priority**: Critical for fixing spelling errors, updating location names, or switching operational status between Active/Inactive.

**Independent Test**: Can be tested by choosing a location to edit, changing its attributes (e.g., changing status from Active to Inactive), saving, and verifying the updated attributes appear in the dashboard and are reflected in system behavior.

**Acceptance Scenarios**:

1. **Given** a location "Houston Hobby Airport" exists with status "Active", **When** the administrator edits the location, changes its status to "Inactive", and saves, **Then** the change is saved and reflected in the table.
2. **Given** the edit form, **When** the administrator updates a location's name to match another existing location's name and saves, **Then** a uniqueness validation error is shown and changes are not saved.
3. **Given** the edit form, **When** the administrator cancels the edit, **Then** the original details are retained and they are returned to the list view.

---

### User Story 4 - Delete Location (Priority: P3)

Administrators need to remove locations that are no longer serviced.

**Why this priority**: Keeps the list clean of deprecated or unused locations.

**Independent Test**: Can be tested by clicking the delete option on an unused location, confirming the deletion prompt, and verifying the record is deleted.

**Acceptance Scenarios**:

1. **Given** a location "Temp Pickup Spot" exists and is not associated with any pricing rules or bookings, **When** the administrator deletes it and confirms, **Then** the location is permanently removed and vanishes from the list.
2. **Given** a location is referenced by a pricing rule or booking, **When** the administrator attempts to delete it, **Then** the system blocks the deletion and displays a message explaining that the location is in use and should be deactivated instead.

---

### User Story 5 - Fetch Active Locations for Dropdowns (Priority: P1)

The customer-facing booking wizard needs to retrieve only active locations for destination/pickup dropdown options.

**Why this priority**: Critical customer-facing flow. Prevents customer selection of inactive or deprecated locations.

**Independent Test**: Can be tested by configuring active and inactive locations, rendering the customer-facing booking wizard, and verifying that the dropdowns only list the active ones.

**Acceptance Scenarios**:

1. **Given** locations "New York City" (Active) and "JFK Airport" (Inactive) exist, **When** a customer loads the booking wizard, **Then** "New York City" is available in the location options, and "JFK Airport" is excluded.
2. **Given** active locations of multiple types (e.g., "Paris" of type City, "Orly" of type Airport, "Eiffel Tower" of type Pickup Point) exist, **When** a customer opens the location dropdown in the booking wizard, **Then** the options are categorized under group headings: "Cities", "Airports", and "Pickup Points", with locations sorted alphabetically within each group.

---

### Edge Cases

- **Deleting Referenced Locations**: Trying to delete a location that is referenced in existing pricing rules or booking records must fail with a validation message.
- **Duplicate Names (Case Insensitivity)**: Attempting to create "dallas" when "Dallas" already exists should trigger a validation error to prevent identical-looking dropdown options.
- **Search Sanitization**: The search feature must safely handle special symbols (e.g. `%`, `_`, `*`) without causing server errors or SQL/NoSQL parsing syntax failures.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support CRUD (Create, Read, Update, Delete) operations for geographical Locations.
- **FR-002**: Location schema MUST include Name (unique string, single-language, non-empty), Type (enum: "City", "Airport", "Pickup Point"), and Status (enum: "Active", "Inactive").
- **FR-003**: The admin dashboard MUST display all locations in a paginated list view with at least 10 items per page by default.
- **FR-004**: The locations list view MUST provide case-insensitive search by location Name.
- **FR-005**: The admin dashboard MUST provide forms for adding and editing locations with input validation (Name is required, must be unique case-insensitively, and Type and Status are required).
- **FR-006**: The system MUST restrict location deletion: if a location is referenced by other entities (e.g., booking records or pricing rules), deletion is blocked, returning an error message recommending deactivation.
- **FR-007**: The customer-facing API/UI endpoints MUST only fetch and expose locations with status "Active".
- **FR-008**: The customer-facing booking wizard dropdowns MUST organize active locations grouped by Type (Cities, Airports, Pickup Points) and sorted alphabetically within each group.

### Key Entities *(include if feature involves data)*

- **Location**:
  - `id`: Unique identifier
  - `name`: Unique name (string)
  - `type`: Category ("City", "Airport", "Pickup Point")
  - `status`: Availability status ("Active", "Inactive")

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin dashboard search queries and pagination transitions for locations return results in under 500 milliseconds.
- **SC-002**: Customer booking wizard retrieves the active locations and populates dropdown lists in under 500 milliseconds.
- **SC-003**: 100% of inactive locations are filtered out from customer dropdown menus.
- **SC-004**: 100% of attempts to delete in-use locations are blocked, maintaining relational integrity.

## Assumptions

- **AS-001**: Location names are unique globally (case-insensitively) to prevent ambiguity in customer-facing dropdowns.
- **AS-002**: The admin UI will be integrated into the existing administrative layout.
- **AS-003**: Customer-facing dropdowns do not require parent-child grouping or hierarchical filtering (e.g., matching pickup points to cities) and will display them grouped by Type (Cities, Airports, Pickup Points).
- **AS-004**: All client requests to the locations admin endpoints are authenticated and restricted to administrator users.
