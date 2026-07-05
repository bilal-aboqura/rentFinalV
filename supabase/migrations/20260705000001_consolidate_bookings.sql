-- ============================================================
-- Migration: 20260705000001_consolidate_bookings.sql
-- Consolidates the bookings table after the conflicting earlier
-- migrations (20260623000000 vs 20260626000000) and adds the
-- airport/hotel transfer fields required for the new booking flow.
--
-- Every statement is idempotent (IF NOT EXISTS / DO blocks) so it
-- is safe to run regardless of which earlier migration "won".
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Normalize status casing + default.
--    Earlier constraints only allowed lowercase values, so we must
--    drop any pre-existing status constraint BEFORE backfilling rows
--    to PascalCase. Otherwise the UPDATE itself can fail mid-migration.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

UPDATE public.bookings
SET status = CASE
  WHEN status = 'pending'   THEN 'Pending'
  WHEN status = 'confirmed' THEN 'Confirmed'
  WHEN status = 'completed' THEN 'Completed'
  WHEN status = 'cancelled' THEN 'Cancelled'
  WHEN status = 'assigned'  THEN 'Assigned'
  ELSE status
END
WHERE status IS DISTINCT FROM (
  CASE
    WHEN status = 'pending'   THEN 'Pending'
    WHEN status = 'confirmed' THEN 'Confirmed'
    WHEN status = 'completed' THEN 'Completed'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status = 'assigned'  THEN 'Assigned'
    ELSE status
  END
);

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('Pending', 'Confirmed', 'Assigned', 'Completed', 'Cancelled'));

ALTER TABLE public.bookings
  ALTER COLUMN status SET DEFAULT 'Pending';

-- ─────────────────────────────────────────────────────────────
-- 2. Email is no longer required (WhatsApp/phone is primary).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ALTER COLUMN customer_email DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN customer_email SET DEFAULT '';

-- ─────────────────────────────────────────────────────────────
-- 3. Expand payment_method enum: cash / card_pos / bank_transfer.
--    Drop the legacy cash/visa check before backfilling rows, or
--    the UPDATE from visa -> card_pos can violate the old constraint.
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

UPDATE public.bookings
SET payment_method = CASE
  WHEN payment_method = 'visa' THEN 'card_pos'
  ELSE payment_method
END
WHERE payment_method = 'visa';

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('cash', 'card_pos', 'bank_transfer'));

-- ─────────────────────────────────────────────────────────────
-- 4. Airport/hotel transfer fields.
--    pickup_location_id / destination_location_id stay as the
--    canonical ROUTE used for pricing (a location row). The
--    *_type / *_text columns hold the human-readable detail
--    (airport name, hotel name, full address, or "other").
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS trip_type TEXT NOT NULL DEFAULT 'one_way';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_type TEXT NOT NULL DEFAULT 'airport';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS pickup_text TEXT NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dropoff_type TEXT NOT NULL DEFAULT 'address';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dropoff_text TEXT NOT NULL DEFAULT '';

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%trip_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_trip_type_check CHECK (trip_type IN ('one_way', 'round_trip'));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%pickup_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_pickup_type_check CHECK (pickup_type IN ('airport', 'hotel', 'address', 'other'));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%dropoff_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_dropoff_type_check CHECK (dropoff_type IN ('airport', 'hotel', 'address', 'other'));

-- Flight number (clean customer-facing field; required at app layer
-- whenever airport is involved in pickup or drop-off).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS flight_number TEXT;

-- Round-trip return leg.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_date_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_pickup_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_destination_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_flight_number TEXT;

-- Selected car + booking language + customer notes.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%language%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_language_check CHECK (language IN ('ar', 'en'));

-- ─────────────────────────────────────────────────────────────
-- 5. Indexes for the new lookup patterns.
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_route_idx
  ON public.bookings (pickup_location_id, destination_location_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings (created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 6. RLS: anon may only insert Pending bookings (already present
--    from earlier migrations, re-asserted defensively).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings'
      AND policyname = 'Allow guests to insert booking requests'
  ) THEN
    CREATE POLICY "Allow guests to insert booking requests"
      ON public.bookings FOR INSERT TO anon
      WITH CHECK (status = 'Pending');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bookings'
      AND policyname = 'Allow admin full access to bookings'
  ) THEN
    CREATE POLICY "Allow admin full access to bookings"
      ON public.bookings FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
