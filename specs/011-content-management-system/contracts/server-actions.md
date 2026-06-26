# API Contract: Next.js Server Actions

This document specifies the programming interface contract for the Server Actions managing the Content Management System.

## 1. Get Site Settings (`getSiteSettings`)

Fetches the configuration settings. This action is cached using Next.js caching utilities and revalidated under the tag `cms-settings`.

* **Signature**:
  ```typescript
  export async function getSiteSettings(): Promise<SiteSettings>
  ```
* **Input**: None.
* **Returns**:
  * Resolves with a `SiteSettings` object.
  * If the database does not contain a configuration record yet, resolves with the default values (Maroon/Royal Black and default placeholders).
* **Exception/Failure Modes**:
  * If database connection fails, falls back gracefully to default settings values rather than throwing an unhandled exception.

---

## 2. Update Site Settings (`updateSiteSettings`)

Updates the textual fields and brand colors in the single configuration row.

* **Signature**:
  ```typescript
  export async function updateSiteSettings(
    input: UpdateSiteSettingsInput
  ): Promise<{ success: boolean; error?: string }>
  ```
* **Input Parameters**:
  * `input`: An object satisfying `UpdateSiteSettingsInput`:
    ```typescript
    {
      hero_title: string;
      about_text: string;
      contact_phone: string;
      contact_email: string;
      brand_primary_color: string;
      brand_secondary_color: string;
    }
    ```
* **Validation Rules**:
  * All fields are required and must not be empty.
  * `contact_email` must be a valid email format.
  * `brand_primary_color` and `brand_secondary_color` must be valid hex codes or standard CSS color strings.
* **Returns**:
  * `{ success: true }` if validation passes and data is successfully persisted.
  * `{ success: false, error: string }` if validation fails or database persistence fails.
* **Side Effects**:
  * Triggers Next.js tag revalidation for `cms-settings` on success to purge the cached settings layout.

---

## 3. Upload Site Asset (`uploadSiteAsset`)

Uploads an image file to Supabase Storage and associates the resulting public URL with the `site_settings` table.

* **Signature**:
  ```typescript
  export async function uploadSiteAsset(
    formData: FormData
  ): Promise<{ success: boolean; url?: string; error?: string }>
  ```
* **Input Parameters**:
  * `formData`: Standard `FormData` object containing:
    * `file`: The `File` object to upload.
    * `assetType`: A string literal, either `'logo'` or `'hero'`.
* **Validation Rules**:
  * `file` must be an image type (`image/png`, `image/jpeg`, `image/webp`).
  * `file` size must not exceed 5MB.
  * `assetType` must be strictly either `'logo'` or `'hero'`.
* **Returns**:
  * `{ success: true, url: string }` representing the public Supabase storage URL of the newly uploaded asset.
  * `{ success: false, error: string }` on validation or upload failure.
* **Side Effects**:
  * Overwrites the previous asset at the designated path in Supabase Storage.
  * Updates the corresponding column (`site_logo_url` or `hero_image_url`) in the database `site_settings` table.
  * Triggers Next.js tag revalidation for `cms-settings` on success.
