# Server Actions Contracts: Pricing Management

This document defines the TypeScript interface contract for the Next.js Server Actions that mutate or fetch Route Price (Pricing Rules) data.

## 1. Create Route Price Action

Adds a new pricing rule for a route to the Supabase database.

### Signature
```typescript
export async function createRoutePriceAction(
  input: CreateRoutePriceInput
): Promise<ServerActionResponse<RoutePrice>>
```

### Parameters
- `input`: `CreateRoutePriceInput` (object containing `pickupLocationId`, `destinationLocationId`, and `price`)

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "pickupLocationId": "550e8400-e29b-41d4-a716-446655440000",
    "destinationLocationId": "660e8400-e29b-41d4-a716-446655440000",
    "price": 55.00,
    "createdAt": "2026-06-23T17:00:00Z"
  }
}
```

#### Failure (Zod Validation Error)
```json
{
  "success": false,
  "validationErrors": {
    "price": ["Price must be a positive number greater than zero"]
  }
}
```

#### Failure (Same Location check_different_locations Constraint)
```json
{
  "success": false,
  "validationErrors": {
    "destinationLocationId": ["Pickup and destination locations must be different"]
  }
}
```

#### Failure (Duplicate Route unique_pickup_destination Database Constraint)
```json
{
  "success": false,
  "error": "A pricing rule for this route already exists."
}
```

---

## 2. Update Route Price Action

Modifies the price of an existing route pricing rule.

### Signature
```typescript
export async function updateRoutePriceAction(
  input: UpdateRoutePriceInput
): Promise<ServerActionResponse<RoutePrice>>
```

### Parameters
- `input`: `UpdateRoutePriceInput` (object containing `id`, and optionally `pickupLocationId`, `destinationLocationId`, `price`)

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "pickupLocationId": "550e8400-e29b-41d4-a716-446655440000",
    "destinationLocationId": "660e8400-e29b-41d4-a716-446655440000",
    "price": 65.00,
    "createdAt": "2026-06-23T17:00:00Z"
  }
}
```

#### Failure (Not Found)
```json
{
  "success": false,
  "error": "Pricing rule not found."
}
```

#### Failure (Duplicate Route unique_pickup_destination Database Constraint on Edit)
```json
{
  "success": false,
  "error": "A pricing rule for this route already exists."
}
```

---

## 3. Delete Route Price Action

Deletes an existing pricing rule.

### Signature
```typescript
export async function deleteRoutePriceAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>>
```

### Parameters
- `id`: Unique UUID string of the target pricing rule.

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Failure (Database Error / Not Found)
```json
{
  "success": false,
  "error": "Failed to delete pricing rule. It may have already been removed or does not exist."
}
```
