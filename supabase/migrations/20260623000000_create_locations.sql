-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('City', 'Airport', 'Pickup Point')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Case-insensitive unique index on location name
CREATE UNIQUE INDEX IF NOT EXISTS unique_location_name_case_insensitive ON locations (LOWER(name));

-- Enable Row Level Security
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
-- Read-only select query for active locations.
CREATE POLICY "Allow public read access to active locations"
  ON locations FOR SELECT
  USING (is_active = true);

-- Policy 2: Admin Operations
-- Admins must be authenticated to perform any action on locations.
CREATE POLICY "Allow admin full access"
  ON locations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
