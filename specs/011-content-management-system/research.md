# Research & Design Decisions: Content Management System (CMS)

This document records the core architectural and implementation decisions for the CMS feature.

## 1. Database Table Design

* **Decision**: Create a table `site_settings` with structured columns and a database constraint enforcing a single row.
* **Rationale**: A single-row table with structured columns guarantees TypeScript safety and database-level checks. It avoids mapping rows to keys and provides direct queries.
* **Alternatives Considered**: 
  * *Key-Value Table*: Rejected because it lacks column-level data types and requires parsing string values for integers, booleans, or colors.
  * *JSONB Table*: Rejected because it does not enforce a strict SQL schema structure.

## 2. Enforcing Single-Row Policy

* **Decision**: Add a check constraint `CONSTRAINT site_settings_single_row CHECK (id = 1)` with `id` as the Primary Key.
* **Rationale**: This is a simple, declarative way to restrict the database from containing more than one settings profile. It does not require complex trigger functions.
* **Alternatives Considered**:
  * *Database Trigger*: Rejected as it introduces unnecessary complexity and potential execution overhead compared to a declarative check constraint.

## 3. Visual Assets Storage

* **Decision**: Create a public bucket in Supabase Storage named `public_assets`.
* **Rationale**: Integrates cleanly with the existing Supabase server-side client, keeping our dependency footprint minimal and lightweight.
* **Alternatives Considered**:
  * *Third-Party CDNs (Cloudinary, AWS S3)*: Rejected because the feature specification contains a strict constraint to rely strictly on Supabase Storage.

## 4. Cache & Revalidation

* **Decision**: Cache site settings retrieval using Next.js `unstable_cache` with a tag named `cms-settings`, and trigger revalidation (`revalidateTag`) during updates.
* **Rationale**: Since the Homepage and Footer fetch settings on every guest request, caching prevents unnecessary database queries while ensuring updates show up instantly upon admin save.
* **Alternatives Considered**:
  * *Static Site Generation (SSG) with ISR*: Rejected because color/text branding changes need to be reflected immediately across all routes without full rebuilds.
