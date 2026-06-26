# Research: Bookings Dashboard Technical Design

This document details the architectural decisions, database modification migrations, server actions, and validation strategies for the Bookings Management Dashboard.

## Decisions & Rationale

### 1. Database Schema Updates (Supabase Migration)
* **Decision**: Create a new SQL migration file (`supabase/migrations/20260626000001_update_bookings_schema.sql`) to alter the `bookings` table.
* **SQL Structure**:
  ```sql
  -- Add driver_id foreign key referencing drivers table
  ALTER TABLE bookings 
    ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

  -- Drop existing status check constraint dynamically and add a new one containing 'Completed'
  DO $$
  DECLARE
      r record;
  BEGIN
      FOR r IN
          SELECT constraint_name 
          FROM information_schema.constraint_column_usage 
          WHERE table_name = 'bookings' AND column_name = 'status'
      LOOP
          EXECUTE 'ALTER TABLE bookings DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
      END LOOP;
  END;
  $$;

  ALTER TABLE bookings 
    ADD CONSTRAINT bookings_status_check CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled'));
  ```
* **Rationale**: The new `driver_id` column connects the bookings table with the drivers table. Using `ON DELETE SET NULL` ensures that deleting a driver does not delete the booking history, but leaves the trip "Unassigned". The dynamic check constraint drop is necessary because constraint names generated automatically by PostgreSQL (e.g. `bookings_status_check` or a random identifier) might vary, and we must guarantee that the status constraint allows `'Completed'`.

### 2. Server-side Authorization check
* **Decision**: Verify user is logged in as an authenticated admin in all administrative server actions.
* **Rationale**: The `createClient()` utility reads the session cookie. Since the Supabase RLS policies block `anon` (unauthenticated guest) users from calling ALL/UPDATE operations, calling `.update()` with an unauthenticated client will fail at the database level. However, we also add explicit validation checking in Server Actions:
  ```typescript
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Administrator access required.' };
  }
  ```

### 3. Server Actions Design & Operations
* **Decision**: Implement three server actions in `src/app/admin/bookings/actions.ts`:
  1. `fetchBookingsAction`: Server Action to fetch all bookings with server-side pagination, status filtering, and locations/drivers joins.
  2. `updateBookingStatusAction`: Server Action to update booking status with terminal state checks.
  3. `assignDriverAction`: Server Action to assign `driver_id` to a booking.

### 4. Terminal State Restriction Logic
* **Decision**: Implement a validation step inside `updateBookingStatusAction` and `assignDriverAction` that queries the booking's current status and blocks modifications if it is `'Completed'` or `'Cancelled'`.
* **Rationale**: To prevent data tampering and keep clean audit logs, once a booking reaches a terminal state, its details and status must be immutable.
* **Code Implementation**:
  ```typescript
  const { data: currentBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();

  if (fetchError || !currentBooking) {
    return { success: false, error: 'Booking not found.' };
  }

  if (currentBooking.status === 'Completed' || currentBooking.status === 'Cancelled') {
    return { success: false, error: 'Cannot modify a booking that is in a terminal state (Completed or Cancelled).' };
  }
  ```

### 5. Frontend Join Performance
* **Decision**: Use a single nested Supabase select query to fetch routes and driver information efficiently in one request.
* **Query Format**:
  ```typescript
  const { data, count, error } = await supabase
    .from('bookings')
    .select('*, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), driver:drivers(name)', { count: 'exact' })
    .eq('status', statusFilter) // if filtered
    .order('created_at', { ascending: false })
    .range(start, end);
  ```
* **Rationale**: This eliminates N+1 query problems and retrieves all display details (pickup location name, destination location name, driver name) in a single database round-trip.
