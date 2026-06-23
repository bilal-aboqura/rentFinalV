# REST API Contracts: Airport Transfer and Driver Booking System

All endpoints communicate using JSON payloads. Secure endpoints (`/api/admin/*`) require a valid JWT token passed in an HTTP-only secure cookie named `token`.

---

## Public Endpoints

### 1. Fetch Locations
- **Endpoint**: `GET /api/locations`
- **Description**: Returns all active cities and airports.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "City Center",
    "type": "city",
    "status": "active"
  },
  {
    "id": 2,
    "name": "International Airport",
    "type": "airport",
    "status": "active"
  }
]
```

### 2. Calculate Quote Price
- **Endpoint**: `GET /api/bookings/price`
- **Description**: Calculates the pricing based on pickup, destination, and vehicle class.
- **Query Parameters**:
  - `pickup_location_id` (Integer)
  - `destination_location_id` (Integer)
  - `vehicle_class` (String: `standard`, `executive`, `van`)
- **Response**: `200 OK`
```json
{
  "pickup_location_id": 1,
  "destination_location_id": 2,
  "vehicle_class": "executive",
  "price": 75.00
}
```
- **Response**: `404 Not Found` (if no pricing rule exists)
```json
{
  "error": "No pricing rule defined for the selected route and vehicle class."
}
```

### 3. Create Booking Request
- **Endpoint**: `POST /api/bookings`
- **Description**: Submits a new booking. Validates trip date/time is in the future.
- **Request Body**:
```json
{
  "pickup_location_id": 1,
  "destination_location_id": 2,
  "trip_date_time": "2026-07-01T14:30:00.000Z",
  "vehicle_class": "standard",
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "customer_phone": "+1234567890"
}
```
- **Response**: `201 Created`
```json
{
  "id": 45,
  "reference_id": "BK-A3F9D1",
  "pickup_location_id": 1,
  "destination_location_id": 2,
  "trip_date_time": "2026-07-01T14:30:00.000Z",
  "vehicle_class": "standard",
  "customer_name": "John Doe",
  "customer_email": "john.doe@example.com",
  "customer_phone": "+1234567890",
  "total_price": 45.00,
  "status": "pending",
  "driver_id": null
}
```

### 4. Submit Contact Form
- **Endpoint**: `POST /api/contact`
- **Description**: Saves contact message and registers notification.
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "message": "Interested in booking business travel."
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Your message was sent successfully."
}
```

### 5. Fetch FAQ Content
- **Endpoint**: `GET /api/content/faq`
- **Description**: Returns dynamic homepage FAQ list.
- **Response**: `200 OK`
```json
[
  {
    "key": "faq_1",
    "value": "{\"question\": \"How do I cancel?\", \"answer\": \"Contact us at least 24 hours prior.\"}"
  }
]
```

---

## Admin Endpoints (Secure)

### 1. Admin Login
- **Endpoint**: `POST /api/admin/login`
- **Description**: Validates admin credentials and issues JWT in HttpOnly cookie.
- **Request Body**:
```json
{
  "username": "admin",
  "password": "SecurePassword123"
}
```
- **Response**: `200 OK` (Cookie set: `token=eyJhbGci...; HttpOnly; Secure; SameSite=Strict`)
```json
{
  "success": true,
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### 2. Admin Logout
- **Endpoint**: `POST /api/admin/logout`
- **Description**: Clears JWT token cookie.
- **Response**: `200 OK`
```json
{
  "success": true
}
```

### 3. Fetch Bookings (with search, filter, paginate)
- **Endpoint**: `GET /api/admin/bookings`
- **Query Parameters**:
  - `page` (Integer, default 1)
  - `limit` (Integer, default 10)
  - `status` (String: `pending`, `confirmed`, `completed`, `cancelled`)
  - `search` (String: filter by customer name or email or reference_id)
- **Response**: `200 OK`
```json
{
  "count": 120,
  "rows": [
    {
      "id": 45,
      "reference_id": "BK-A3F9D1",
      "trip_date_time": "2026-07-01T14:30:00.000Z",
      "customer_name": "John Doe",
      "total_price": 45.00,
      "status": "pending",
      "Driver": null
    }
  ]
}
```

### 4. Update Booking Status
- **Endpoint**: `PATCH /api/admin/bookings/:id/status`
- **Request Body**:
```json
{
  "status": "confirmed"
}
```
- **Response**: `200 OK` (Triggers SMTP customer email notification in background)
```json
{
  "id": 45,
  "status": "confirmed"
}
```

### 5. Assign Driver to Booking
- **Endpoint**: `PATCH /api/admin/bookings/:id/driver`
- **Description**: Assigns driver. Performs overlap validation checks (3-hour window).
- **Request Body**:
```json
{
  "driver_id": 4
}
```
- **Response**: `200 OK`
```json
{
  "id": 45,
  "driver_id": 4
}
```
- **Response**: `400 Bad Request` (Conflict found)
```json
{
  "error": "Driver is already assigned to another booking within 3 hours of this trip."
}
```

### 6. Manage Drivers (CRUD - Example Create)
- **Endpoint**: `POST /api/admin/drivers`
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "phone": "+1999999999",
  "license_plate": "SAR-888"
}
```
- **Response**: `201 Created`
```json
{
  "id": 4,
  "name": "Sarah Connor",
  "phone": "+1999999999",
  "license_plate": "SAR-888",
  "status": "active"
}
```
