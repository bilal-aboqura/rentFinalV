# Data Model: Content Management System (CMS)

This document describes the database schema, storage bucket configuration, and TypeScript types for the CMS settings.

## 1. Database Schema (`site_settings` Table)

A single-row configuration table is created to store site-wide configurations.

```sql
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
```

### Row Level Security (RLS) Policies
* **Read Access**: Allow anyone (anonymous and authenticated) to read the settings.
  ```sql
  CREATE POLICY "Allow public read access to site_settings"
    ON site_settings FOR SELECT
    TO anon, authenticated
    USING (true);
  ```
* **Write Access (Insert/Update/Delete)**: Only authenticated users (admins) can modify the settings.
  ```sql
  CREATE POLICY "Allow admin full access to site_settings"
    ON site_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  ```

---

## 2. Supabase Storage Bucket (`public_assets`)

A public bucket named `public_assets` is created to store brand assets such as logos and background images.

* **Public**: `true` (objects are accessible via public URL without a signature)
* **RLS Policies on `storage.objects`**:
  * **Select**: Allow public read access to objects.
    ```sql
    CREATE POLICY "Allow public read access to assets"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'public_assets');
    ```
  * **Insert/Update/Delete**: Restrict modifications to authenticated admin users.
    ```sql
    CREATE POLICY "Allow admin to manage assets"
      ON storage.objects FOR ALL
      TO authenticated
      USING (bucket_id = 'public_assets')
      WITH CHECK (bucket_id = 'public_assets');
    ```

---

## 3. TypeScript Interface

These definitions will be maintained in the application type definitions.

```typescript
export interface SiteSettings {
  id: number; // Constrained to 1
  hero_title: string;
  about_text: string;
  contact_phone: string;
  contact_email: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  hero_image_url: string | null;
  site_logo_url: string | null;
  updated_at: string;
}

export type UpdateSiteSettingsInput = Omit<SiteSettings, 'id' | 'updated_at' | 'hero_image_url' | 'site_logo_url'>;
```
