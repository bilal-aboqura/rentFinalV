# Data Model: Status Change Alert

This document maps out the data fields and relationship joins required to support Feature F-09: Status Change Alert.

## 1. Booking Entity (Extended Details)

The unified `BookingWithDetails` type is extended to include the driver's phone number as part of the driver details.

### Entity Attributes

| Field Name | Type | Description | Source |
|---|---|---|---|
| `customer_email` | `string` | The recipient email address for notifications. | `bookings.customer_email` |
| `booking_reference` | `string` | Unique reference code for the booking. | `bookings.booking_reference` |
| `status` | `'Pending' \| 'Confirmed' \| 'Completed' \| 'Cancelled'` | The current state of the booking. | `bookings.status` |
| `pickup.name` | `string` | Name of the pickup location. | Joined via `pickup_location_id` |
| `destination.name` | `string` | Name of the destination location. | Joined via `destination_location_id` |
| `driver.name` | `string` | Assigned driver's name. | Joined via `driver_id` |
| `driver.phone` | `string` (Optional) | Assigned driver's phone number. | Joined via `driver_id` |

---

## 2. Driver Entity (Join Mapping)

When driver assignment occurs or a confirmed booking is queried, the driver details are fetched from the `drivers` table:

- **Table**: `drivers`
- **Columns used**:
  - `name` (TEXT)
  - `phone` (TEXT)
