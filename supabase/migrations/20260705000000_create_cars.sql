-- ============================================================
-- Migration: 20260705000000_create_cars.sql
-- Car catalog for the booking flow. Cars map to a vehicle_class
-- (standard / executive / van) so route-based pricing in
-- pricing_rules can be looked up per car.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  vehicle_class TEXT NOT NULL CHECK (vehicle_class IN ('standard', 'executive', 'van')),
  passenger_capacity INTEGER NOT NULL DEFAULT 4 CHECK (passenger_capacity BETWEEN 1 AND 99),
  luggage_capacity INTEGER NOT NULL DEFAULT 2 CHECK (luggage_capacity BETWEEN 0 AND 99),
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS cars_active_sort_idx
  ON public.cars (is_active, sort_order);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cars'
      AND policyname = 'Allow public read access to cars'
  ) THEN
    CREATE POLICY "Allow public read access to cars"
      ON public.cars FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'cars'
      AND policyname = 'Allow admin full access to cars'
  ) THEN
    CREATE POLICY "Allow admin full access to cars"
      ON public.cars FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- Seed: placeholder car catalog (editable from /admin/cars).
-- Each car maps to a vehicle_class used for pricing lookup.
-- ============================================================
INSERT INTO public.cars (name, name_ar, vehicle_class, passenger_capacity, luggage_capacity, sort_order, is_active)
VALUES
  ('Economy Sedan',         'سيدان اقتصادية',   'standard',   4, 2, 1,  true),
  ('Toyota Camry',          'تويوتا كامري',      'standard',   4, 2, 2,  true),
  ('Hyundai Elantra',       'هيونداي إلنترا',    'standard',   4, 2, 3,  true),
  ('Mercedes E-Class',      'مرسيدس الفئة E',    'executive',  4, 3, 4,  true),
  ('GMC Yukon',             'جي إم سي يوكون',   'executive',  6, 4, 5,  true),
  ('Hyundai Hiace',         'هيونداي هاييس',     'van',        9, 6, 6,  true),
  ('Hyundai Staria',        'هيونداي ستاريا',    'van',        7, 5, 7,  true)
ON CONFLICT DO NOTHING;
