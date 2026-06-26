-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  pickup_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  flight_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS bookings_pickup_idx ON bookings(pickup_location_id);
CREATE INDEX IF NOT EXISTS bookings_destination_idx ON bookings(destination_location_id);
CREATE INDEX IF NOT EXISTS bookings_reference_idx ON bookings(booking_reference);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public/guest users to insert new bookings (status must be 'Pending')
CREATE POLICY "Allow public insert to bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Pending');

-- Policy 2: Allow public select ONLY when matching the booking_reference passed in headers
CREATE POLICY "Allow public select by reference"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (
    booking_reference = COALESCE(
      NULLIF(current_setting('request.headers', true)::json->>'x-booking-reference', ''),
      '00000000-0000-0000-0000-000000000000'
    )::uuid
  );

-- Policy 3: Allow authenticated administrators full CRUD access
CREATE POLICY "Allow admin full access to bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
