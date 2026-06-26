-- Add driver_id column to bookings referencing drivers
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- Drop the status check constraint if it exists and add the updated check constraint
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

-- Create index on driver_id for performance
CREATE INDEX IF NOT EXISTS bookings_driver_idx ON bookings(driver_id);
