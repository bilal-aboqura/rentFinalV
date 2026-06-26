# Booking Actions Contracts

This contract defines the modified Server Actions interfaces and the expected outcomes on email dispatches.

## 1. `updateBookingStatusAction`

Updates the booking status in the database.

- **Trigger Condition**:
  - Transition to `Confirmed`: Triggers `sendBookingConfirmedEmail` asynchronously.
  - Transition to `Cancelled`: Triggers `sendBookingCancelledEmail` asynchronously.

```typescript
export async function updateBookingStatusAction(
  input: { bookingId: string; status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' }
): Promise<ServerActionResponse<BookingWithDetails>>;
```

---

## 2. `assignDriverAction`

Assigns or updates a driver for the booking.

- **Trigger Condition**:
  - If the booking status is *already* `'Confirmed'`, trigger `sendBookingConfirmedEmail` asynchronously.
  - If the status is not `'Confirmed'` (e.g. `'Pending'`), do NOT trigger any confirmation email.

```typescript
export async function assignDriverAction(
  input: { bookingId: string; driverId: string | null }
): Promise<ServerActionResponse<BookingWithDetails>>;
```
