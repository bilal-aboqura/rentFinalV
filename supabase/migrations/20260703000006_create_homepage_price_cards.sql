CREATE TABLE IF NOT EXISTS public.homepage_price_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS homepage_price_cards_sort_order_idx
  ON public.homepage_price_cards (sort_order ASC, created_at ASC);

ALTER TABLE public.homepage_price_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_price_cards'
      AND policyname = 'Allow public read access to homepage_price_cards'
  ) THEN
    CREATE POLICY "Allow public read access to homepage_price_cards"
      ON public.homepage_price_cards
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'homepage_price_cards'
      AND policyname = 'Allow authenticated users to manage homepage_price_cards'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage homepage_price_cards"
      ON public.homepage_price_cards
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
