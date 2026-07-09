-- ============================================================
-- Hospitality options + booking hospitality selections
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hospitality_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.hospitality_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hospitality_options'
      AND policyname = 'Allow public read access to hospitality_options'
  ) THEN
    CREATE POLICY "Allow public read access to hospitality_options"
      ON public.hospitality_options
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hospitality_options'
      AND policyname = 'Allow authenticated users to manage hospitality_options'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage hospitality_options"
      ON public.hospitality_options
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS passenger_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS hospitality_selections JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.bookings'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%passenger_count%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_passenger_count_check CHECK (passenger_count >= 1);

UPDATE public.bookings
SET hospitality_selections = '[]'::jsonb
WHERE hospitality_selections IS NULL;

INSERT INTO public.hospitality_options (name, name_ar, sort_order, is_active)
SELECT seed.name, seed.name_ar, seed.sort_order, true
FROM (
  VALUES
    ('Tea', 'شاي', 0),
    ('Coffee', 'قهوة', 1)
) AS seed(name, name_ar, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.hospitality_options existing
  WHERE lower(existing.name) = lower(seed.name)
     OR existing.name_ar = seed.name_ar
);
