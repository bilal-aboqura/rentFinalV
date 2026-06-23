# Server Actions Contracts: Cities & Airports Management

This document defines the TypeScript interface contract for the Next.js Server Actions that mutate or fetch Locations data.

## 1. Create Location Action

Adds a new location to the Supabase database.

### Signature
```typescript
export async function createLocationAction(
  input: CreateLocationInput
): Promise<ServerActionResponse<Location>>
```

### Parameters
- `input`: `CreateLocationInput` (object containing `name`, `type`, and optionally `isActive`)

### Output Examples

#### Success Response (Status Code 200 equivalent)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Boston Logan Airport",
    "type": "Airport",
    "isActive": true,
    "createdAt": "2026-06-23T17:00:00Z"
  }
}
```

#### Failure (Zod Validation Error)
```json
{
  "success": false,
  "validationErrors": {
    "name": ["Location name must be at least 2 characters long"]
  }
}
```

#### Failure (Duplicate Name Database Constraint)
```json
{
  "success": false,
  "error": "A location with this name already exists."
}
```

---

## 2. Update Location Action

Modifies attributes of an existing location.

### Signature
```typescript
export async function updateLocationAction(
  input: UpdateLocationInput
): Promise<ServerActionResponse<Location>>
```

### Parameters
- `input`: `UpdateLocationInput` (object containing `id`, and optionally `name`, `type`, `isActive`)

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Boston Logan Airport",
    "type": "Airport",
    "isActive": false,
    "createdAt": "2026-06-23T17:00:00Z"
  }
}
```

#### Failure (Not Found)
```json
{
  "success": false,
  "error": "Location not found."
}
```

---

## 3. Delete Location Action

Deletes a location if it is not referenced by existing bookings or pricing rules.

### Signature
```typescript
export async function deleteLocationAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>>
```

### Parameters
- `id`: Unique UUID string of the target location.

### Output Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Failure (Referential Integrity Blocked)
```json
{
  "success": false,
  "error": "Cannot delete this location because it is currently referenced by booking records or pricing rules. Consider deactivating it instead."
}
```
