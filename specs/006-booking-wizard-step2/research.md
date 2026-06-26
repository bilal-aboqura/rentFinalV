# Research: Booking Wizard Step 2 Technical Design

This document details the architectural decisions, validation schemas, and database policy structures for the Booking Confirmation implementation.

## Decisions & Rationale

### 1. Booking Reference Type & Format
* **Decision**: Use a PostgreSQL UUID generated natively in the database via `gen_random_uuid()` for `booking_reference`, as explicitly requested.
* **Rationale**: Natively generated UUIDs ensure cryptographic randomness, preventing reference enumeration attacks, and simplify RLS references.
* **Alternatives Considered**: A custom alphanumeric string prefix (e.g. `BK-XXXXXX`), but UUID matches database standards and is requested.

### 2. Row Level Security (RLS) Policy on Bookings
* **Decision**: Implement Reference-Based Public Read RLS via custom HTTP headers.
* **SQL Structure**:
  ```sql
  -- Enable RLS
  ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

  -- Policy 1: Public/guest users can INSERT new bookings
  CREATE POLICY "Allow public insert to bookings"
    ON bookings FOR INSERT
    TO anon
    WITH CHECK (status = 'Pending');

  -- Policy 2: Public/guest users can SELECT a specific booking ONLY if they provide the booking_reference in headers
  CREATE POLICY "Allow public select by reference"
    ON bookings FOR SELECT
    TO anon
    USING (
      booking_reference = COALESCE(
        NULLIF(current_setting('request.headers', true)::json->>'x-booking-reference', ''),
        '00000000-0000-0000-0000-000000000000'
      )::uuid
    );

  -- Policy 3: Authenticated administrators have full CRUD access
  CREATE POLICY "Allow admin full access to bookings"
    ON bookings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  ```
* **Rationale**: Prevents data leaks of passenger details. Guests can only query their specific booking details by providing the UUID reference inside the custom header `x-booking-reference` when invoking the Supabase client.
* **Alternatives Considered**: Disabling public SELECT and doing all reading via Server Actions. However, database RLS enforces security at the data layer, protecting the system if APIs are bypassed.

### 3. Server-side Price Verification
* **Decision**: Securely fetch the route price from the database in `submitBooking` Server Action using the pickup and destination IDs, and verify it matches the submitted price.
* **Rationale**: Prevents client-side manipulation (e.g. modifying the DOM/state to submit a $1 booking).
* **Validation Check**:
  ```typescript
  const { data: priceRow } = await supabase
    .from('route_prices')
    .select('price')
    .eq('pickup_location_id', pickupLocationId)
    .eq('destination_location_id', destinationLocationId)
    .single();

  if (!priceRow || Math.abs(Number(priceRow.price) - price) > 0.01) {
    throw new Error('Price verification failed. Price does not match.');
  }
  ```

### 4. Phone Number E.164 Validation
* **Decision**: Validate phone numbers against the E.164 standard using the regular expression `^\+[1-9]\d{1,14}$`.
* **Rationale**: E.164 numbers are prefixed with `+`, followed by a country code and national destination/subscriber number, containing up to 15 digits total.

### 5. SMTP Notification Delivery
* **Decision**: Use `nodemailer` in the Next.js server context, loading SMTP settings from environment variables.
* **Rationale**: Provides stable integration with external SMTP servers like Mailtrap (development) and production mail providers.
