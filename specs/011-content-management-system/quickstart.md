# Quickstart Validation Guide: Content Management System (CMS)

This guide documents the procedures for setting up, running, and verifying the CMS feature.

## 1. Prerequisites & Setup

1. **Environment Variables**: Verify that local configuration in `.env.local` includes your Supabase URL, Anon Key, and Service/Admin keys (if applicable) for backend connection:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. **Install Dependencies**: Run at the project root to ensure all packages are available:
   ```bash
   npm install
   ```
3. **Database Setup**: Execute the database migration to create the table, constraints, bucket, and RLS policies:
   * Location of migration script: [20260626000003_create_site_settings.sql](file:///c:/Users/anasa/Desktop/rentFinal/supabase/migrations/20260626000003_create_site_settings.sql)
   * Apply migration command (Supabase CLI):
     ```bash
     npx supabase db push
     ```

---

## 2. Running Automated Tests

We utilize Vitest to run backend unit tests for the Server Actions.

* Run the CMS unit test suite:
  ```bash
  npx vitest run tests/unit/cms-actions.test.ts
  ```
* Run with coverage reporting:
  ```bash
  npx vitest run tests/unit/cms-actions.test.ts --coverage
  ```

---

## 3. Manual E2E Verification Scenario

Follow these steps to manually test the feature end-to-end:

### Step 1: Admin Panel Updates
1. Login as an authenticated administrator.
2. Navigate to `/admin/content`.
3. Verify that the current settings load inside standard text inputs, textareas, and color pickers.
4. Modify the values:
   * Hero Title: `Rent the Best Cars Today`
   * About Us: `Established in 2026, RentFinal is your premier transport partner.`
   * Primary Brand Color: `#990000` (Maroon hex code)
5. Click **Save Settings** and verify the success notification is displayed.

### Step 2: Visual Asset Uploads
1. On `/admin/content`, find the **Site Logo** file input.
2. Choose a valid image file (`logo.png`, under 5MB) and click **Upload**.
3. Verify that the preview displays the new logo and no error occurs.
4. Repeat for the **Hero Background** with a background asset (`hero-bg.jpg`).

### Step 3: Customer Page Verification
1. Open the public homepage `/` in a private browsing window.
2. Verify that:
   * The page background/elements use the updated brand colors (`#990000`).
   * The hero title reads `Rent the Best Cars Today`.
   * The navigation bar displays the newly uploaded logo.
   * The footer displays the updated phone and email contact info.
