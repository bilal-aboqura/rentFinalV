# Server Actions Contracts: Booking Wizard (Step 1)

This document defines the TypeScript interface contract for the Next.js Server Actions that support Step 1 of the Booking Wizard.

## Types

```typescript
export interface ServerActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}
```

---

## 1. Check Route Price Action

Retrieves the flat-rate price for a given pickup and destination location pair from the pricing matrix.

### Signature
```typescript
export async function checkRoutePriceAction(
  pickupLocationId: string,
  destinationLocationId: string
): Promise<ServerActionResponse<{ price: number | null }>>
```

### Output Examples

#### Success (Price Configured)
```json
{
  "success": true,
  "data": {
    "price": 75.00
  }
}
```

#### Success (No Price Configured)
```json
{
  "success": true,
  "data": {
    "price": null
  }
}
```

#### Failure (Database Error)
```json
{
  "success": false,
  "error": "Failed to retrieve route pricing information."
}
```

---

## 2. Validate Booking Schedule Action

Validates whether the selected date and time string satisfies the server's local operational timezone 2-hour lead time buffer.

### Signature
```typescript
export async function validateBookingScheduleAction(
  date: string,
  time: string
): Promise<ServerActionResponse<{ isValid: boolean }>>
```

### Output Examples

#### Success (Valid Schedule)
```json
{
  "success": true,
  "data": {
    "isValid": true
  }
}
```

#### Failure (Validation / Business Logic Error)
```json
{
  "success": false,
  "validationErrors": {
    "time": ["Bookings must be made at least 2 hours in advance of the current server time."]
  }
}
```
