# Feature Specification: Trip Details Form & Booking Confirmation (Step 2)

**Feature Branch**: `006-booking-wizard-step2`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-05: 'Trip Details Form & Booking Confirmation (Step 2)' for the customer-facing web application. The purpose is to collect the passenger's personal details, contact info, and finalize the reservation.

Requirements:
1. State Integration: Retrieve the selected Route (Pickup/Destination), Date, Time, and Calculated Price from the parent booking wizard state established in F-04.
2. Order Summary: Display a clear, read-only summary of the trip parameters and the final calculated price to the user before they fill out their details.
3. Passenger Input Fields:
   - Full Name (Required).
   - Email Address (Required - essential for sending the guest transactional email notifications via SMTP).
   - Phone Number (Required, validate against E.164 international standard format).
   - Flight Number (Optional text field, utilized for airport pickup tracking).
   - Special Notes/Requests (Optional text area).
4. Database Persistence: On successful form submission, save the entire booking record to the database with a default operational status of "Pending". 
5. Success Transition: After a successful database insert, clear the wizard state and transition the UI to a clean "Success Confirmation" view or page, displaying a unique booking reference identifier and a professional thank-you message.
6. Strict Constraints: Absolutely DO NOT integrate any third-party payment gateways (Stripe, PayPal, Kashier, etc.). This is a booking reservation-only system."

## Clarifications

### Session 2026-06-26

- Q: How should read access to the `bookings` table be restricted under RLS? → A: Reference-Based Public Read: Public users can read a specific booking only if they provide its unique `booking_reference`. Authenticated admins have full access.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review Trip Summary & Input Passenger Information (Priority: P1)

Customers who have completed Step 1 of the booking wizard can review their selected route and price summary before entering their personal details. The system enforces validation on mandatory customer inputs before permitting reservation submission.

**Why this priority**: Essential step to capture and validate passenger identity and contact info before creating a booking.

**Independent Test**: Start the wizard step 2 with valid pre-selected route parameters. Verify that the order summary card displays the correct details and price. Fill in correct, validated details and verify the form enables the confirmation action. Try entering an invalid phone number or leaving a required field blank, verifying that validation warnings display.

**Acceptance Scenarios**:

1. **Given** the customer has completed route, date, time, and pricing calculation, **When** they transition to Step 2, **Then** they see a read-only order summary displaying the pickup location name, destination location name, date, time, and final calculated price.
2. **Given** the passenger details form is displayed, **When** the customer attempts to submit the form with empty "Full Name", "Email Address", or "Phone Number" fields, **Then** the system displays specific validation warnings for those fields and blocks submission.
3. **Given** a customer enters a phone number, **When** the format does not conform to the E.164 international standard (e.g. missing "+" prefix or country code, or containing invalid characters), **Then** the system displays a formatting warning and blocks submission.

---

### User Story 2 - Booking Persistence & State Reset (Priority: P2)

Upon form submission, the system records the booking details in the database as "Pending" and clears the wizard's temporary state.

**Why this priority**: Core system function to record a valid reservation in the database and clear local state to prevent duplicate submissions or state leaks.

**Independent Test**: Complete and submit the passenger form with valid inputs. Verify that a booking record is written to the database with a default status of "Pending" and containing all correct trip and customer attributes. Verify that the local step and wizard states are cleared immediately.

**Acceptance Scenarios**:

1. **Given** the customer submits a validated form, **When** the transaction is processed, **Then** a booking record is saved to the database with all route parameters, passenger details, calculated price, and a default status of "Pending".
2. **Given** a successful database save, **When** the operation completes, **Then** the parent wizard's local step and selected route states are fully cleared.

---

### User Story 3 - Booking Success Confirmation (Priority: P3)

After a successful database write, the customer is presented with a professional confirmation screen displaying their unique booking reference.

**Why this priority**: Confirms to the customer that their reservation is received, providing them a unique identifier for follow-ups.

**Independent Test**: Submit a valid booking. Confirm that the UI transitions to a thank-you page displaying a unique booking reference and a summary of the booking. Verify that no payment gateway elements or payment prompts are rendered.

**Acceptance Scenarios**:

1. **Given** a booking has been successfully saved to the database, **When** the wizard transitions, **Then** the customer is presented with a "Success Confirmation" view containing a professional thank-you message and a unique, human-readable booking reference.
2. **Given** the confirmation view is active, **When** viewing the interface, **Then** no third-party payment options, inputs, or references to payment gateways are shown.

### Edge Cases

- **E.164 Phone Format Variations**: The user might input spaces, hyphens, or parentheses in their phone number. The system must either strip these formatting characters during validation/storage or explicitly validate that the final cleaned string conforms to `+` followed by 7 to 15 digits.
- **Database Save Failure / Timeout**: If the database is temporarily unreachable or the save action times out, the system must display an error message requesting the user to retry, without clearing the wizard state, so that the passenger's inputs are not lost.
- **Email Delivery Failure (SMTP)**: If the transactional email dispatch fails due to an SMTP configuration error or provider timeout, the booking record must still be created, and the user must still see the success confirmation. The system should log the email failure but not block the user flow.
- **Direct Page Navigation**: If a user attempts to navigate directly to the Step 2 route or confirmation page without any Step 1 state, they must be gracefully redirected back to Step 1.
- **Duplicate Form Submission**: If a user clicks the confirmation button multiple times in rapid succession, the system must disable the button and show a loading indicator to prevent multiple database records from being created for the same booking.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST retrieve the active Step 1 booking parameters (pickup location, destination location, date, time, and price) from the parent wizard state.
- **FR-002**: System MUST display a read-only summary card containing the selected pickup name, destination name, date, time, and calculated price.
- **FR-003**: System MUST provide input fields for Passenger Full Name (Required), Email Address (Required), Phone Number (Required), Flight Number (Optional), and Special Notes/Requests (Optional).
- **FR-004**: System MUST validate the phone number format against the E.164 international standard (starts with `+` followed by 7 to 15 digits) on both client and server side.
- **FR-005**: System MUST validate that the email address is well-formed.
- **FR-006**: On successful form submission, the system MUST persist the entire booking details to the database with a default operational status of "Pending".
- **FR-007**: System MUST generate a unique, non-sequential booking reference identifier (UUID format) for each booking.
- **FR-008**: System MUST clear the temporary parent wizard state upon a successful database insert.
- **FR-009**: System MUST transition the UI to a "Success Confirmation" view displaying a professional thank-you message and the unique booking reference.
- **FR-010**: System MUST trigger a transactional email notification via SMTP to the passenger's email address upon successful booking creation.
- **FR-011**: System MUST NOT integrate any third-party payment gateways or request payment/credit card details.
- **FR-012**: System MUST disable the form submit button and display a loading indicator during submission to prevent duplicate booking requests.
- **FR-013**: System MUST enforce Row Level Security (RLS) policies on the `bookings` table. Public/guest users MUST be restricted to insert-only access, and read (select) access is allowed only when query filters match the exact, unique `booking_reference` value. Authenticated administrators MUST retain full access to all booking records.

### Key Entities *(include if feature involves data)*

- **Booking**: Represents a finalized ride reservation.
  - Attributes:
    - `id` (UUID, primary key)
    - `booking_reference` (UUID, unique, default `gen_random_uuid()`)
    - `pickup_location_id` (UUID, foreign key referencing locations)
    - `destination_location_id` (UUID, foreign key referencing locations)
    - `pickup_date` (DATE)
    - `pickup_time` (TIME)
    - `price` (NUMERIC)
    - `passenger_name` (TEXT)
    - `passenger_email` (TEXT)
    - `passenger_phone` (TEXT)
    - `flight_number` (TEXT, optional)
    - `special_notes` (TEXT, optional)
    - `status` (TEXT, default 'Pending', check constraint: 'Pending', 'Confirmed', 'Cancelled')
    - `created_at` (TIMESTAMP)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can review the order summary, complete the form, and submit the booking request in under 1 minute on average.
- **SC-002**: 100% of submitted phone numbers are validated against the E.164 standard, blocking invalid inputs before database submission.
- **SC-003**: 100% of successful submissions result in a database record with a status of "Pending" and a unique UUID booking reference.
- **SC-004**: The booking wizard state is 100% cleared, and the confirmation view is rendered in under 500ms after database confirmation.
- **SC-005**: 100% of bookings are reservation-only with zero payment gateway dependencies or components loaded.

## Assumptions

- **AS-001**: The database has a `bookings` table that can associate with the `locations` table.
- **AS-002**: The parent component manages the navigation and shared state between Step 1 and Step 2 of the wizard.
- **AS-003**: SMTP server configuration is provided via system environment variables.
- **AS-004**: The system's hosting environment has outbound network access for SMTP mail delivery.
