-- Create route_prices table
CREATE TABLE IF NOT EXISTS route_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL CHECK (price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate pricing rules for the exact same pickup and destination pair
  CONSTRAINT unique_pickup_destination UNIQUE (pickup_location_id, destination_location_id),
  
  -- Prevent setting the same location as both pickup and destination
  CONSTRAINT check_different_locations CHECK (pickup_location_id <> destination_location_id)
);

-- Enable Row Level Security
ALTER TABLE route_prices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
-- Read-only select query for all pricing.
CREATE POLICY "Allow public read access to route prices"
  ON route_prices FOR SELECT
  USING (true);

-- Policy 2: Admin Operations
-- Admins must be authenticated to perform any action on route prices.
CREATE POLICY "Allow admin full access"
  ON route_prices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
