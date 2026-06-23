# Server Actions Contracts: Drivers Management

This document defines the TypeScript interface contract for the Next.js Server Actions that mutate or retrieve Driver records.

## Types

```typescript
export interface Driver {
  id: string;
  name: string;
  phone: string;
  availability_status: 'Available' | 'Busy' | 'Inactive';
  created_at: string;
}

export type ServerActionResponse<T> =
  | { success: true; data: T }
  | { success: false; validationErrors?: Record<string, string[]>; error?: string };
```

---

## 1. Create Driver Action

Creates and registers a new driver in the database. Normalizes the phone number before checking for uniqueness.

### Signature
```typescript
export async function createDriverAction(
  input: CreateDriverInput
): Promise<ServerActionResponse<Driver>>
```

### Parameters
- `input`: `CreateDriverInput` (object containing `name`, `phone`, and optionally `availability_status`)

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Smith",
    "phone": "+15550100200",
    "availability_status": "Available",
    "created_at": "2026-06-23T18:00:00Z"
  }
}
```

#### Failure (Zod Validation Error)
```json
{
  "success": false,
  "validationErrors": {
    "name": ["Name must be at least 2 characters long"],
    "phone": ["Phone number must be at least 10 characters long"]
  }
}
```

#### Failure (Duplicate Phone Number database constraint)
```json
{
  "success": false,
  "error": "A driver with this phone number is already registered."
}
```

---

## 2. Update Driver Action

Modifies the details of an existing driver.

### Signature
```typescript
export async function updateDriverAction(
  input: UpdateDriverInput
): Promise<ServerActionResponse<Driver>>
```

### Parameters
- `input`: `UpdateDriverInput` (object containing `id`, and optionally `name`, `phone`, or `availability_status`)

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Smith",
    "phone": "+15550100200",
    "availability_status": "Busy",
    "created_at": "2026-06-23T18:00:00Z"
  }
}
```

#### Failure (Not Found)
```json
{
  "success": false,
  "error": "Driver not found."
}
```

#### Failure (Duplicate Phone Number on Edit)
```json
{
  "success": false,
  "error": "A driver with this phone number is already registered."
}
```

---

## 3. Delete Driver Action

Removes a driver from the database.

### Signature
```typescript
export async function deleteDriverAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>>
```

### Parameters
- `id`: Unique UUID string of the driver.

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Failure (Database Error / Not Found)
```json
{
  "success": false,
  "error": "Failed to delete driver. It may have already been removed or does not exist."
}
```
