-- ============================================================
-- Migration: 20260705000003_seed_pricing_and_locations.sql
-- Adds Taif location and seeds flat-rate pricing_rules for the
-- common KSA transfer routes x vehicle_class so the booking flow
-- never hits the "no prices" dead-end for seeded routes.
--
-- pricing_rules is keyed on (pickup_location_id,
-- destination_location_id, vehicle_class). Routes are inserted in
-- BOTH directions so one-way and reverse trips are both priced.
-- ============================================================

-- Add Taif city + airport (idempotent).
INSERT INTO public.locations (name, type, status)
VALUES
  ('Taif', 'city', 'active'),
  ('Taif Regional Airport (TF)', 'airport', 'active')
ON CONFLICT (name) DO NOTHING;

-- Helper: insert a priced route by resolving location names.
DO $$
DECLARE
  -- city / airport name -> id
  jed_airport UUID := (SELECT id FROM public.locations WHERE name = 'King Abdulaziz International Airport (JED)');
  ruh_airport UUID := (SELECT id FROM public.locations WHERE name = 'King Khalid International Airport (RUH)');
  med_airport UUID := (SELECT id FROM public.locations WHERE name = 'Prince Mohammad bin Abdulaziz International Airport (MED)');
  dmm_airport UUID := (SELECT id FROM public.locations WHERE name = 'King Fahd International Airport (DMM)');
  tf_airport  UUID := (SELECT id FROM public.locations WHERE name = 'Taif Regional Airport (TF)');

  jeddah   UUID := (SELECT id FROM public.locations WHERE name = 'Jeddah');
  makkah   UUID := (SELECT id FROM public.locations WHERE name = 'Makkah');
  madinah  UUID := (SELECT id FROM public.locations WHERE name = 'Madinah');
  riyadh   UUID := (SELECT id FROM public.locations WHERE name = 'Riyadh');
  dammam   UUID := (SELECT id FROM public.locations WHERE name = 'Dammam');
  khobar   UUID := (SELECT id FROM public.locations WHERE name = 'Al Khobar');
  taif     UUID := (SELECT id FROM public.locations WHERE name = 'Taif');
BEGIN
  -- (pickup, destination, standard, executive, van)
  INSERT INTO public.pricing_rules (pickup_location_id, destination_location_id, vehicle_class, price)
  VALUES
    -- Jeddah Airport <-> Makkah
    (jed_airport, makkah, 'standard',   250),
    (jed_airport, makkah, 'executive',  400),
    (jed_airport, makkah, 'van',        550),
    (makkah, jed_airport, 'standard',   250),
    (makkah, jed_airport, 'executive',  400),
    (makkah, jed_airport, 'van',        550),
    -- Jeddah Airport <-> Madinah
    (jed_airport, madinah, 'standard',  600),
    (jed_airport, madinah, 'executive', 900),
    (jed_airport, madinah, 'van',      1200),
    (madinah, jed_airport, 'standard',  600),
    (madinah, jed_airport, 'executive', 900),
    (madinah, jed_airport, 'van',      1200),
    -- Jeddah Airport <-> Jeddah (city)
    (jed_airport, jeddah, 'standard',   120),
    (jed_airport, jeddah, 'executive',  200),
    (jed_airport, jeddah, 'van',        280),
    (jeddah, jed_airport, 'standard',   120),
    (jeddah, jed_airport, 'executive',  200),
    (jeddah, jed_airport, 'van',        280),
    -- Madinah Airport <-> Madinah / Makkah
    (med_airport, madinah, 'standard',  120),
    (med_airport, madinah, 'executive', 200),
    (med_airport, madinah, 'van',       280),
    (madinah, med_airport, 'standard',  120),
    (madinah, med_airport, 'executive', 200),
    (madinah, med_airport, 'van',       280),
    (med_airport, makkah, 'standard',   480),
    (med_airport, makkah, 'executive',  750),
    (med_airport, makkah, 'van',       1000),
    (makkah, med_airport, 'standard',   480),
    (makkah, med_airport, 'executive',  750),
    (makkah, med_airport, 'van',       1000),
    -- Riyadh Airport <-> Riyadh
    (ruh_airport, riyadh, 'standard',   120),
    (ruh_airport, riyadh, 'executive',  200),
    (ruh_airport, riyadh, 'van',        280),
    (riyadh, ruh_airport, 'standard',   120),
    (riyadh, ruh_airport, 'executive',  200),
    (riyadh, ruh_airport, 'van',        280),
    -- Dammam Airport <-> Dammam / Al Khobar
    (dmm_airport, dammam, 'standard',   140),
    (dmm_airport, dammam, 'executive',  220),
    (dmm_airport, dammam, 'van',        320),
    (dammam, dmm_airport, 'standard',   140),
    (dammam, dmm_airport, 'executive',  220),
    (dammam, dmm_airport, 'van',        320),
    (dmm_airport, khobar, 'standard',   160),
    (dmm_airport, khobar, 'executive',  250),
    (dmm_airport, khobar, 'van',        350),
    (khobar, dmm_airport, 'standard',   160),
    (khobar, dmm_airport, 'executive',  250),
    (khobar, dmm_airport, 'van',        350),
    -- Taif Airport <-> Makkah / Taif
    (tf_airport, makkah, 'standard',    200),
    (tf_airport, makkah, 'executive',   320),
    (tf_airport, makkah, 'van',         450),
    (makkah, tf_airport, 'standard',    200),
    (makkah, tf_airport, 'executive',   320),
    (makkah, tf_airport, 'van',         450),
    (tf_airport, taif, 'standard',       90),
    (tf_airport, taif, 'executive',     160),
    (tf_airport, taif, 'van',           240),
    (taif, tf_airport, 'standard',       90),
    (taif, tf_airport, 'executive',     160),
    (taif, tf_airport, 'van',           240)
  ON CONFLICT (pickup_location_id, destination_location_id, vehicle_class)
  DO UPDATE SET price = EXCLUDED.price;
END $$;
