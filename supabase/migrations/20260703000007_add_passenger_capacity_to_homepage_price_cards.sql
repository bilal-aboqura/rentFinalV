ALTER TABLE public.homepage_price_cards
ADD COLUMN IF NOT EXISTS passenger_capacity integer NOT NULL DEFAULT 4;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'homepage_price_cards_passenger_capacity_check'
  ) THEN
    ALTER TABLE public.homepage_price_cards
    ADD CONSTRAINT homepage_price_cards_passenger_capacity_check
    CHECK (passenger_capacity >= 1 AND passenger_capacity <= 99);
  END IF;
END $$;
