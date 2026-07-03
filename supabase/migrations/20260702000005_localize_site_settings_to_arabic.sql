ALTER TABLE public.site_settings
  ALTER COLUMN hero_title SET DEFAULT 'خدمة نقل مميزة من وإلى المطار',
  ALTER COLUMN about_text SET DEFAULT 'نوفر خدمة نقل احترافية بسائقين موثوقين وتجربة حجز عربية واضحة وأنيقة.';

UPDATE public.site_settings
SET
  hero_title = 'خدمة نقل مميزة من وإلى المطار',
  about_text = 'نوفر خدمة نقل احترافية بسائقين موثوقين وتجربة حجز عربية واضحة وأنيقة.',
  updated_at = NOW()
WHERE id = 1
  AND (
    hero_title IN (
      'Premium Car Rentals & Airport Transfers',
      'Premium Airport Transfers'
    )
    OR about_text = 'We provide premier transport services with professional drivers.'
  );
