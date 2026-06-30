-- Feature 011: Content Management System site settings and public assets.

CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  hero_title text NOT NULL DEFAULT 'Premium Car Rentals & Airport Transfers',
  about_text text NOT NULL DEFAULT 'We provide premier transport services with professional drivers.',
  contact_phone text NOT NULL DEFAULT '+1 (555) 019-9000',
  contact_email text NOT NULL DEFAULT 'contact@rentfinal.com',
  brand_primary_color text NOT NULL DEFAULT '#800000',
  brand_secondary_color text NOT NULL DEFAULT '#050505',
  hero_image_url text,
  site_logo_url text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);

INSERT INTO public.site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'Allow public read access to site_settings'
  ) THEN
    CREATE POLICY "Allow public read access to site_settings"
      ON public.site_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'Allow authenticated users to manage site_settings'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage site_settings"
      ON public.site_settings
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public_assets',
  'public_assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow public read access to public_assets'
  ) THEN
    CREATE POLICY "Allow public read access to public_assets"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'public_assets');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow authenticated users to manage public_assets'
  ) THEN
    CREATE POLICY "Allow authenticated users to manage public_assets"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (bucket_id = 'public_assets')
      WITH CHECK (bucket_id = 'public_assets');
  END IF;
END $$;
