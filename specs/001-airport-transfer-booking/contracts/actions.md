# Server Actions Contracts: Airport Transfer and Driver Booking System

This document defines the TypeScript interface contract for the Next.js Server Actions used in the booking system. All mutations must perform validation and check permissions before executing.

---

## Type Helpers

```typescript
export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> };
```

---

## Public Actions (Customer Facing)

### 1. Create Booking Action
Submits a new guest booking request. Performs future date validation and calculates totals.
- **Signature**:
  ```typescript
  export async function createBookingAction(
    input: CreateBookingInput
  ): Promise<ServerActionResponse<Booking>>
  ```
- **Parameters**:
  ```typescript
  export interface CreateBookingInput {
    pickupLocationId: string;
    destinationLocationId: string;
    tripDateTime: string; // ISO String
    vehicleClass: 'standard' | 'executive' | 'van';
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "data": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "referenceId": "BK-E39A5D",
      "pickupLocationId": "110e8400-e29b-41d4-a716-446655440000",
      "destinationLocationId": "220e8400-e29b-41d4-a716-446655440000",
      "tripDateTime": "2026-07-15T14:30:00.000Z",
      "vehicleClass": "standard",
      "customerName": "John Doe",
      "customerEmail": "john.doe@example.com",
      "customerPhone": "+1234567890",
      "totalPrice": 45.00,
      "status": "pending",
      "driverId": null
    }
  }
  ```
- **Output Failure (Validation)**:
  ```json
  {
    "success": false,
    "error": "Validation failed.",
    "validationErrors": {
      "tripDateTime": ["Booking date and time must be in the future."]
    }
  }
  ```

### 2. Submit Contact Action
Saves a visitor inquiry in system content/logs and notifies administrators.
- **Signature**:
  ```typescript
  export async function submitContactAction(
    input: ContactInput
  ): Promise<ServerActionResponse<{ success: boolean }>>
  ```

---

## Secure Actions (Admin Only)
All admin actions must verify that the active user is authenticated with administrator permissions.

### 1. Update Booking Status Action
Transitions a booking's lifecycle. Confirmation or cancellation triggers a background transactional email to the customer.
- **Signature**:
  ```typescript
  export async function updateBookingStatusAction(
    bookingId: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ): Promise<ServerActionResponse<Booking>>
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "data": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "status": "confirmed"
    }
  }
  ```

### 2. Assign Driver Action
Assigns an active driver to a booking. Checks for scheduling conflicts: throws an error if the driver is already assigned to a booking within a 3-hour window.
- **Signature**:
  ```typescript
  export async function assignDriverAction(
    bookingId: string,
    driverId: string | null
  ): Promise<ServerActionResponse<Booking>>
  ```
- **Output Success**:
  ```json
  {
    "success": true,
    "data": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "driverId": "990e8400-e29b-41d4-a716-446655440000"
    }
  }
  ```
- **Output Failure (Conflict)**:
  ```json
  {
    "success": false,
    "error": "Scheduling conflict: Driver is already assigned to another booking within 3 hours of this trip."
  }
  ```

### 3. Create Driver Action
- **Signature**:
  ```typescript
  export async function createDriverAction(
    input: CreateDriverInput
  ): Promise<ServerActionResponse<Driver>>
  ```
- **Parameters**:
  ```typescript
  export interface CreateDriverInput {
    name: string;
    phone: string;
    licensePlate: string;
  }
  ```
