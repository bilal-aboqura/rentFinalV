-- Allow hospitality to be enabled for selected vehicles only.
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS hospitality_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS cars_hospitality_enabled_idx
  ON public.cars (hospitality_enabled)
  WHERE hospitality_enabled = true;
