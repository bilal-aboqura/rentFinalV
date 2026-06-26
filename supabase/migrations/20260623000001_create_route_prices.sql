-- Create route_prices table
CREATE TABLE IF NOT EXISTS route_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate pricing rules for the exact same pickup and destination pair
  CONSTRAINT unique_pickup_destination UNIQUE (pickup_location_id, destination_location_id),
  
  -- Enforce valid positive route pricing
  CONSTRAINT check_positive_price CHECK (price > 0),

  -- Prevent setting the same location as both pickup and destination
  CONSTRAINT check_different_locations CHECK (pickup_location_id <> destination_location_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_positive_price'
      AND conrelid = 'route_prices'::regclass
  ) THEN
    ALTER TABLE route_prices
      ADD CONSTRAINT check_positive_price CHECK (price > 0);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE route_prices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Customer Booking Wizard & Public access
-- Read-only select query for all pricing.
DROP POLICY IF EXISTS "Allow public read access to route prices" ON route_prices;
CREATE POLICY "Allow public read access to route prices"
  ON route_prices FOR SELECT
  USING (true);

-- Policy 2: Admin Operations
-- Admins must be authenticated to perform any action on route prices.
DROP POLICY IF EXISTS "Allow admin full access" ON route_prices;
CREATE POLICY "Allow admin full access"
  ON route_prices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
