# Feature Specification: Content Management System (CMS)

**Feature Branch**: `011-content-management-system`

**Created**: 2026-06-26

**Status**: Draft

**Input**: User description: "Build Feature F-11: \"Content Management System (CMS)\" for the CMS & General epic. The purpose is to allow administrators to manage dynamic site content (texts, images, and branding) directly from the dashboard.

Requirements:
1. Database (Content & Branding): Create a `site_settings` table (either key-value pairs or structured columns) to store dynamic text (e.g., Hero Title, About Us text, Contact Phone/Email) and theme configurations. Set the default brand color scheme values to Maroon and Royal Black.
2. Storage (Images): Utilize Supabase Storage by creating a public bucket (e.g., `public_assets`) to handle image uploads for key site visuals (e.g., Hero Background, Site Logo).
3. Admin UI: Create a dedicated `/admin/content` page featuring standard forms to update the text/brand settings and file uploaders for managing images.
4. Customer UI: Update the public-facing pages (e.g., Homepage, Footer) to fetch and display data dynamically from `site_settings` and the Supabase Storage URLs, replacing existing static placeholders.
5. Strict Constraint: Keep text editing limited to standard text inputs and textareas. Absolutely DO NOT integrate heavy rich-text WYSIWYG editors (like TipTap or CKEditor). Do not use third-party image CDNs; strictly rely on Supabase Storage to maintain our lightweight architecture."

## Clarifications

### Session 2026-06-26

- Q: How should the `site_settings` table be structured to store the configuration fields? → A: Option B: Single-row structured table (where each setting is a dedicated column).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Configures Branding and Text Settings (Priority: P1)

As an Administrator, I want to edit key branding information (colors) and textual content (such as Hero Title, About Us text, Contact Phone, and Contact Email) via a simple form so that the website's branding and textual elements update dynamically.

**Why this priority**: Managing the basic content and brand colors is the foundation of the CMS. It allows admins to update core information immediately without code changes.

**Independent Test**: The administrator logs in, navigates to the content settings, changes the Hero Title from "Old Title" to "New Title", changes the brand primary color to Maroon, and clicks save. The settings are saved, and the homepage displays the new title and color.

**Acceptance Scenarios**:

1. **Given** the administrator is authenticated and on the content settings page, **When** they view the configuration form, **Then** they see fields for Hero Title, About Us text, Contact Phone, Contact Email, Primary Brand Color, and Secondary Brand Color populated with their current values (or defaults).
2. **Given** the form is filled with valid data, **When** the administrator clicks the save button, **Then** the settings are persisted, a success notification is shown, and the new settings take effect immediately across the site.
3. **Given** the brand color fields, **When** the administrator wants to change them, **Then** they can choose Maroon and Royal Black or enter custom hex color values.

---

### User Story 2 - Admin Uploads Branding and Hero Images (Priority: P2)

As an Administrator, I want to upload image assets (such as the Site Logo and Hero Background image) to a dedicated asset storage area so that the website's visuals can be customized.

**Why this priority**: Visual branding is important for the site identity, but secondary to the ability to manage core textual information.

**Independent Test**: The administrator selects a new logo file and uploads it. The preview shows the uploaded image, and the public site starts displaying the new logo.

**Acceptance Scenarios**:

1. **Given** the administrator is on the content settings page, **When** they select a valid image file (PNG, JPG, WebP) for the Site Logo and click upload, **Then** the image is saved to public asset storage, and the page displays a preview of the new logo.
2. **Given** the administrator attempts to upload a file that is too large (over 5MB) or of an invalid type (e.g. PDF), **When** they trigger the upload, **Then** the system displays a clear error message and the upload is rejected.

---

### User Story 3 - Customer Experiences Dynamic Content (Priority: P3)

As a Customer, I want the website (Homepage, Footer, Navigation) to display the customized text, brand colors, and image assets configured by the administrator so that I see the current, correct branding and content.

**Why this priority**: This represents the consumer-facing outcome of the system and depends on the administration and storage features being in place.

**Independent Test**: A customer visits the homepage and footer, verifying that the logo, hero title, background, and contact details match what the admin saved, and the site styles utilize the configured Maroon and Royal Black colors.

**Acceptance Scenarios**:

1. **Given** the admin has updated the site settings and uploaded a new hero background image, **When** a customer loads the Homepage, **Then** the page renders using the customized Maroon and Royal Black branding, the updated Hero Title, and the newly uploaded Hero Background image.
2. **Given** the admin has updated the Contact Phone and Contact Email, **When** a customer views the Homepage Footer, **Then** the updated contact info is dynamically rendered instead of static placeholders.

### Edge Cases

- **Storage upload failure**: If the image storage service is temporarily down or fails during upload, the admin must see a friendly error message and the existing image reference must remain intact.
- **Empty input validation**: If the admin clears a required field (e.g., Hero Title or Contact Email) and attempts to save, the system must display a validation error and refuse to save blank or invalid values.
- **Invalid image format**: If an administrator tries to upload a corrupt file or a file type with a spoofed extension, the storage validation must catch it and reject the upload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store dynamic website content (including Hero Title, About Us text, Contact Phone, Contact Email, Primary Brand Color, and Secondary Brand Color) in a single-row database table with structured columns.
- **FR-002**: The default values for the branding colors MUST be Maroon (Primary) and Royal Black (Secondary).
- **FR-003**: The system MUST support saving references (URLs) for key site visual assets (Hero Background image, Site Logo).
- **FR-004**: The system MUST provide a secure administrator content management page at the `/admin/content` route.
- **FR-005**: The administrator interface MUST use standard text inputs and textareas for text content modifications. Rich-text editors (like WYSIWYG) are explicitly out of scope.
- **FR-006**: The administrator interface MUST include standard file uploaders to upload image assets directly to a dedicated public asset storage bucket.
- **FR-007**: The system MUST enforce image file type restrictions (PNG, JPG, WebP) and size limits (maximum 5MB per upload).
- **FR-008**: Public-facing pages, specifically the Homepage and Footer, MUST fetch content settings and visual assets dynamically, replacing all static placeholders.
- **FR-009**: The website layout and styles MUST dynamically adapt to the primary and secondary colors retrieved from the settings store.

### Key Entities *(include if feature involves data)*

- **Site Settings**: Represents the site-wide textual configurations and branding configurations stored as a single configuration row in the database.
  - Attributes: Hero Title (Text), About Us Text (Text), Contact Phone (Text), Contact Email (Text), Primary Brand Color (Text/Hex), Secondary Brand Color (Text/Hex), Hero Background Image URL (Text/URL), Site Logo URL (Text/URL), Updated At (Timestamp).
- **Asset Storage Bucket**: Represents the public-facing folder where branding image assets are hosted.
  - Attributes: File Name, File Size, Mime Type, Public URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can update and save text settings in under 15 seconds.
- **SC-002**: Changes to text and color settings must reflect on the public-facing pages within 1 second of submission (without requiring database rebuilds or manual deployments).
- **SC-003**: The admin content page must load in under 2 seconds under normal network conditions.
- **SC-004**: File uploads under 2MB must complete within 3 seconds on a standard connection.
- **SC-005**: 100% of public-facing pages render correctly with the custom colors and images, with fallback styles applied if settings are loading or missing.

## Assumptions

- **A-001**: The administrator is authenticated with appropriate administrative privileges before accessing `/admin/content`.
- **A-002**: The target user's browser supports modern HTML5 file upload APIs.
- **A-003**: The asset storage bucket is publicly readable, allowing the public site to fetch and display uploaded assets directly via URL.
- **A-004**: Default fallback text and styles (Maroon and Royal Black) are hardcoded into the application to ensure the site renders correctly if database access fails.
- **A-005**: Text input fields and textareas are sufficient for all text updates, and formatting beyond simple line breaks is not required.
- **A-006**: Out-of-scope: Theme variations other than primary/secondary colors (e.g. font changes or custom layouts) are out of scope.
