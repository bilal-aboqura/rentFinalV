# Interface Contract: Admin Booking Management Actions

This document defines the input and output structures for Next.js Server Actions used in the bookings dashboard.

## 1. `fetchBookingsAction`
Called on component load, pagination shifts, and status filter updates to fetch the bookings.

### Action Signature
```typescript
export async function fetchBookingsAction(input: {
  page: number;
  limit: number;
  statusFilter?: 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}): Promise<ServerActionResponse<{ bookings: BookingWithDetails[]; totalCount: number }>>
```

### Outputs
* **Success**:
  ```json
  {
    "success": true,
    "data": {
      "bookings": [
        {
          "id": "18090280-c13f-4e08-bf28-dfb91885de41",
          "booking_reference": "203a95aa-208b-4946-b605-e408bf4a511c",
          "pickup_location_id": "402a7b8e-cf02-4467-920f-b2587cf51c72",
          "destination_location_id": "833f4a7a-da04-4b53-911e-2144dce5a910",
          "booking_date": "2026-07-01",
          "booking_time": "14:30:00",
          "price": 45.00,
          "customer_name": "Alice Johnson",
          "customer_email": "alice@example.com",
          "customer_phone": "+15551234567",
          "flight_number": "UA123",
          "notes": "Need booster seat",
          "status": "Pending",
          "driver_id": null,
          "created_at": "2026-06-26T03:00:00Z",
          "pickup": { "name": "Airport Terminal 1" },
          "destination": { "name": "Downtown Hotel" },
          "driver": null
        }
      ],
      "totalCount": 1
    }
  }
  ```

---

## 2. `updateBookingStatusAction`
Called when administrators update the status of a specific booking.

### Action Signature
```typescript
export async function updateBookingStatusAction(input: {
  bookingId: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
}): Promise<ServerActionResponse<BookingWithDetails>>
```

### Outputs
* **Success**: Returns the updated booking record.
* **Failure (Terminal Lock Violation)**:
  ```json
  {
    "success": false,
    "error": "Cannot modify a booking that is in a terminal state (Completed or Cancelled)."
  }
  ```
* **Failure (Unauthorized)**:
  ```json
  {
    "success": false,
    "error": "Unauthorized. Administrator access required."
  }
  ```

---

## 3. `assignDriverAction`
Called when administrators assign or remove a driver for a booking.

### Action Signature
```typescript
export async function assignDriverAction(input: {
  bookingId: string;
  driverId: string | null;
}): Promise<ServerActionResponse<BookingWithDetails>>
```

### Outputs
* **Success**: Returns the updated booking record.
* **Failure (Terminal Lock Violation)**:
  ```json
  {
    "success": false,
    "error": "Cannot modify a booking that is in a terminal state (Completed or Cancelled)."
  }
  ```
* **Failure (Unauthorized)**:
  ```json
  {
    "success": false,
    "error": "Unauthorized. Administrator access required."
  }
  ```
