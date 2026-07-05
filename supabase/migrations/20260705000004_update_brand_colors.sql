-- ============================================================
-- Migration: 20260705000004_update_brand_colors.sql
-- Raise contrast on the default brand colors. Only updates rows
-- that still hold the original light values so admin-customized
-- colors are preserved.
-- ============================================================

UPDATE public.site_settings
SET
  brand_primary_color = '#0F6B7A',
  brand_secondary_color = '#9A6A1F'
WHERE brand_primary_color = '#50A6B9'
  AND brand_secondary_color = '#C3A16F';
