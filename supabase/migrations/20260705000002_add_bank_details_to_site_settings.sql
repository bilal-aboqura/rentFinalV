-- ============================================================
-- Migration: 20260705000002_add_bank_details_to_site_settings.sql
-- Bank transfer details shown to the customer when they pick
-- "Bank transfer" as the payment method. Editable from the CMS
-- admin page (/admin/content).
-- ============================================================

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bank_name TEXT NOT NULL DEFAULT 'Al Rajhi Bank';
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT NOT NULL DEFAULT 'Airport Transfer Co.';
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS iban TEXT NOT NULL DEFAULT 'SA00 0000 0000 0000 0000';
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bank_qr_url TEXT;

-- Business WhatsApp number used for the prefilled booking notification.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT '201102770678';
