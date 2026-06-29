-- Migration: Create bookings table with RLS policies
-- Spec: specs/006-booking-wizard-step2/data-model.md
-- Date: 2026-06-26

-- ─────────────────────────────────────────────────────────────
-- Table: bookings
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  pickup_location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  destination_location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  booking_date           DATE NOT NULL,
  booking_time           TIME NOT NULL,
  price                  NUMERIC NOT NULL CHECK (price >= 0),
  customer_name          TEXT NOT NULL,
  customer_email         TEXT NOT NULL,
  customer_phone         TEXT NOT NULL,
  flight_number          TEXT,
  notes                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'Pending'
                           CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- Unique index on booking_reference for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_reference_idx
  ON bookings (booking_reference);

-- Performance index for route queries
CREATE INDEX IF NOT EXISTS bookings_route_idx
  ON bookings (pickup_location_id, destination_location_id);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public (anon) users can INSERT new bookings with status 'Pending'
CREATE POLICY "Allow public insert to bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (status = 'Pending');

-- Policy 2: Public (anon) users can SELECT their own booking using the booking_reference header
-- The client must pass the booking_reference UUID in the 'x-booking-reference' HTTP header.
CREATE POLICY "Allow public select by reference"
  ON bookings
  FOR SELECT
  TO anon
  USING (
    booking_reference = COALESCE(
      NULLIF(current_setting('request.headers', true)::json->>'x-booking-reference', ''),
      '00000000-0000-0000-0000-000000000000'
    )::uuid
  );

-- Policy 3: Authenticated administrators have full CRUD access
CREATE POLICY "Allow admin full access to bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
