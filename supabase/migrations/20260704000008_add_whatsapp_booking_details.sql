-- Add WhatsApp booking handoff details to custoxmder bookings.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS departure_airport TEXT,
  ADD COLUMN IF NOT EXISTS arrival_airport TEXT,
  ADD COLUMN IF NOT EXISTS ticket_number TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_name TEXT,
  ADD COLUMN IF NOT EXISTS driver_phone TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

UPDATE public.bookings
SET
  departure_airport = COALESCE(departure_airport, ''),
  arrival_airport = COALESCE(arrival_airport, ''),
  ticket_number = COALESCE(ticket_number, ''),
  vehicle_name = COALESCE(vehicle_name, ''),
  driver_phone = COALESCE(driver_phone, ''),
  payment_method = COALESCE(payment_method, 'cash');

ALTER TABLE public.bookings
  ALTER COLUMN departure_airport SET DEFAULT '',
  ALTER COLUMN arrival_airport SET DEFAULT '',
  ALTER COLUMN ticket_number SET DEFAULT '',
  ALTER COLUMN vehicle_name SET DEFAULT '',
  ALTER COLUMN driver_phone SET DEFAULT '',
  ALTER COLUMN payment_method SET DEFAULT 'cash',
  ALTER COLUMN departure_airport SET NOT NULL,
  ALTER COLUMN arrival_airport SET NOT NULL,
  ALTER COLUMN ticket_number SET NOT NULL,
  ALTER COLUMN vehicle_name SET NOT NULL,
  ALTER COLUMN driver_phone SET NOT NULL,
  ALTER COLUMN payment_method SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND constraint_name = 'bookings_payment_method_check'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_method_check
      CHECK (payment_method IN ('cash', 'visa'));
  END IF;
END;
$$;
