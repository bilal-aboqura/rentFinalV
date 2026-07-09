ALTER TABLE public.site_settings
  ALTER COLUMN whatsapp_number SET DEFAULT '966503520446';

UPDATE public.site_settings
SET whatsapp_number = '966503520446'
WHERE whatsapp_number IS NULL
   OR btrim(whatsapp_number) = ''
   OR regexp_replace(whatsapp_number, '[^0-9]', '', 'g') = '201102770678';
