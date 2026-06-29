-- Migration: Update bookings schema (driver assignment + 'Completed' status)
-- Spec: specs/007-bookings-dashboard/data-model.md
--       specs/007-bookings-dashboard/research.md
-- Date: 2026-06-26

-- ─────────────────────────────────────────────────────────────
-- 1. Add driver_id foreign key referencing the drivers table
-- ─────────────────────────────────────────────────────────────
-- ON DELETE SET NULL ensures deleting a driver preserves the
-- booking history but leaves the trip "Unassigned".
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Expand the status check constraint to allow 'Completed'
-- ─────────────────────────────────────────────────────────────
-- The auto-generated constraint name can vary, so drop any
-- existing status constraint dynamically before re-adding it.
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
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled'));

-- ─────────────────────────────────────────────────────────────
-- 3. Index for efficient driver assignment lookups
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_driver_id_idx
  ON bookings (driver_id)
  WHERE driver_id IS NOT NULL;
