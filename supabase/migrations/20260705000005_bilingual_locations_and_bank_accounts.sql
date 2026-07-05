-- ============================================================
-- Migration: bilingual location names + multiple bank accounts
-- ============================================================

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS name_ar TEXT;

UPDATE public.locations
SET name_ar = CASE name
  WHEN 'Abha' THEN 'أبها'
  WHEN 'Abha International Airport (AHB)' THEN 'مطار أبها الدولي (AHB)'
  WHEN 'Al Ahsa' THEN 'الأحساء'
  WHEN 'Al Baha' THEN 'الباحة'
  WHEN 'Al Baha Airport (ABT)' THEN 'مطار الباحة (ABT)'
  WHEN 'Al Jouf Airport (AJF)' THEN 'مطار الجوف (AJF)'
  WHEN 'Al Khobar' THEN 'الخبر'
  WHEN 'Arar' THEN 'عرعر'
  WHEN 'Buraidah' THEN 'بريدة'
  WHEN 'Dammam' THEN 'الدمام'
  WHEN 'Hail' THEN 'حائل'
  WHEN 'Hail Regional Airport (HAS)' THEN 'مطار حائل الإقليمي (HAS)'
  WHEN 'Jeddah' THEN 'جدة'
  WHEN 'Jizan' THEN 'جازان'
  WHEN 'Jubail' THEN 'الجبيل'
  WHEN 'Khamis Mushait' THEN 'خميس مشيط'
  WHEN 'King Abdulaziz International Airport (JED)' THEN 'مطار الملك عبدالعزيز الدولي (JED)'
  WHEN 'King Abdullah Airport (GIZ)' THEN 'مطار الملك عبدالله (GIZ)'
  WHEN 'King Fahd International Airport (DMM)' THEN 'مطار الملك فهد الدولي (DMM)'
  WHEN 'King Khalid International Airport (RUH)' THEN 'مطار الملك خالد الدولي (RUH)'
  WHEN 'Madinah' THEN 'المدينة المنورة'
  WHEN 'Makkah' THEN 'مكة المكرمة'
  WHEN 'Najran' THEN 'نجران'
  WHEN 'Najran Airport (EAM)' THEN 'مطار نجران (EAM)'
  WHEN 'Prince Mohammad bin Abdulaziz Airport (MED)' THEN 'مطار الأمير محمد بن عبدالعزيز (MED)'
  WHEN 'Prince Mohammad bin Abdulaziz International Airport (MED)' THEN 'مطار الأمير محمد بن عبدالعزيز الدولي (MED)'
  WHEN 'Prince Nayef bin Abdulaziz Airport (ELQ)' THEN 'مطار الأمير نايف بن عبدالعزيز (ELQ)'
  WHEN 'Riyadh' THEN 'الرياض'
  WHEN 'Sakaka' THEN 'سكاكا'
  WHEN 'Tabuk' THEN 'تبوك'
  WHEN 'Tabuk Regional Airport (TUU)' THEN 'مطار تبوك الإقليمي (TUU)'
  WHEN 'Taif' THEN 'الطائف'
  WHEN 'Taif International Airport (TIF)' THEN 'مطار الطائف الدولي (TIF)'
  WHEN 'Taif Regional Airport (TF)' THEN 'مطار الطائف الإقليمي (TF)'
  WHEN 'Yanbu' THEN 'ينبع'
  WHEN 'Yanbu Airport (YNB)' THEN 'مطار ينبع (YNB)'
  ELSE COALESCE(name_ar, name)
END
WHERE name_ar IS NULL OR name_ar = name;

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  qr_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS bank_accounts_active_sort_idx
  ON public.bank_accounts (is_active, sort_order);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bank_accounts'
      AND policyname = 'Allow public read access to active bank accounts'
  ) THEN
    CREATE POLICY "Allow public read access to active bank accounts"
      ON public.bank_accounts FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bank_accounts'
      AND policyname = 'Allow admin full access to bank accounts'
  ) THEN
    CREATE POLICY "Allow admin full access to bank accounts"
      ON public.bank_accounts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

INSERT INTO public.bank_accounts (bank_name, account_holder_name, iban, qr_url, sort_order, is_active)
SELECT bank_name, account_holder_name, iban, bank_qr_url, 1, true
FROM public.site_settings
WHERE id = 1
  AND NOT EXISTS (SELECT 1 FROM public.bank_accounts);
