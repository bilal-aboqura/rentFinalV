-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  hero_title TEXT NOT NULL DEFAULT 'Premium Car Rentals & Airport Transfers',
  about_text TEXT NOT NULL DEFAULT 'We provide premier transport services with professional drivers.',
  contact_phone TEXT NOT NULL DEFAULT '+1 (555) 019-9000',
  contact_email TEXT NOT NULL DEFAULT 'contact@rentfinal.com',
  brand_primary_color TEXT NOT NULL DEFAULT 'Maroon',
  brand_secondary_color TEXT NOT NULL DEFAULT 'Royal Black',
  hero_image_url TEXT,
  site_logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Enforce that only one row with ID = 1 can exist
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to site_settings
CREATE POLICY "Allow public read access to site_settings"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 2: Allow authenticated administrators full CRUD access
CREATE POLICY "Allow admin full access to site_settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default row if not exists
INSERT INTO site_settings (id, hero_title, about_text, contact_phone, contact_email, brand_primary_color, brand_secondary_color)
VALUES (1, 'Premium Car Rentals & Airport Transfers', 'We provide premier transport services with professional drivers.', '+1 (555) 019-9000', 'contact@rentfinal.com', 'Maroon', 'Royal Black')
ON CONFLICT (id) DO NOTHING;

-- Create public_assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public_assets', 'public_assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for public_assets
-- Policy 1: Allow public read access to assets
CREATE POLICY "Allow public read access to assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public_assets');

-- Policy 2: Allow authenticated admin users to insert assets
CREATE POLICY "Allow admin to insert assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public_assets');

-- Policy 3: Allow authenticated admin users to update assets
CREATE POLICY "Allow admin to update assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public_assets')
  WITH CHECK (bucket_id = 'public_assets');

-- Policy 4: Allow authenticated admin users to delete assets
CREATE POLICY "Allow admin to delete assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'public_assets');
