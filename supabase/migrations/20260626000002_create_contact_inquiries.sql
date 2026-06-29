-- Migration: Create contact_inquiries table with RLS policies
-- Spec: specs/010-contact-inquiries/data-model.md
-- Date: 2026-06-26

-- ─────────────────────────────────────────────────────────────
-- Table: contact_inquiries
-- Stores public contact form submissions (Feature F-10).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Unread'
                CHECK (status IN ('Unread', 'Read', 'Resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- Performance index for the admin dashboard, which lists inquiries
-- sorted by newest first (created_at DESC) with server-side pagination.
CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx
  ON contact_inquiries (created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public (anon + authenticated) can INSERT new inquiries,
-- but only with the initial 'Unread' status.
CREATE POLICY "Allow public insert to contact_inquiries"
  ON contact_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'Unread');

-- Policy 2: Authenticated administrators have full CRUD access.
CREATE POLICY "Allow admin full access to contact_inquiries"
  ON contact_inquiries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
