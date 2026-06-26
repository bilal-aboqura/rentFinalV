# Data Model: New Request Alert (Feature F-08)

This feature does not introduce new database tables or fields. It leverages the existing `bookings` table schema to retrieve the pending count and construct admin email alerts.

## Existing Schema Utilized

### `bookings` Table

We query and read the following columns:

| Column Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Unique database identifier |
| `booking_reference` | `uuid` | Unique, Default: `gen_random_uuid()` | Public-facing customer reservation ID |
| `pickup_location_id` | `uuid` | Foreign Key -> `locations.id` | Pickup location reference |
| `destination_location_id` | `uuid` | Foreign Key -> `locations.id` | Destination location reference |
| `booking_date` | `date` | Not Null | Date of transfer |
| `booking_time` | `time` | Not Null | Time of transfer |
| `price` | `numeric` | Not Null | Total calculated cost |
| `customer_name` | `text` | Not Null | Guest full name |
| `customer_email` | `text` | Not Null | Guest contact email |
| `status` | `text` | Not Null, Default: `'Pending'` | Booking workflow state. Valid values: `'Pending'`, `'Confirmed'`, `'Completed'`, `'Cancelled'` |

## State Transition Trigger

- When a new booking is inserted, the status defaults to `'Pending'`.
- This insertion triggers the asynchronous execution of the admin email alert workflow.
- Any transition *out* of the `'Pending'` state (e.g. to `'Confirmed'`, `'Completed'`, or `'Cancelled'`) will decrease the pending badge count dynamically upon dashboard navigation or refresh.
