'use client';

import { useMemo, useState, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Palette,
  Save,
  Upload,
} from 'lucide-react';
import {
  updateSiteSettings,
  uploadSiteAsset,
} from '@/app/actions/cms';
import type { SiteAssetType, SiteSettings, UpdateSiteSettingsInput } from '@/types';

interface ContentSettingsFormProps {
  initialSettings: SiteSettings;
}

type UploadState = {
  logo: File | null;
  hero: File | null;
};

const initialMessage = { type: '', text: '' };

type PreviewStyle = CSSProperties & {
  '--preview-primary': string;
  '--preview-secondary': string;
};

export default function ContentSettingsForm({
  initialSettings,
}: ContentSettingsFormProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [settings, setSettings] = useState<UpdateSiteSettingsInput>({
    hero_title: initialSettings.hero_title,
    about_text: initialSettings.about_text,
    contact_phone: initialSettings.contact_phone,
    contact_email: initialSettings.contact_email,
    brand_primary_color: initialSettings.brand_primary_color,
    brand_secondary_color: initialSettings.brand_secondary_color,
  });
  const [assetUrls, setAssetUrls] = useState({
    logo: initialSettings.site_logo_url,
    hero: initialSettings.hero_image_url,
  });
  const [uploads, setUploads] = useState<UploadState>({ logo: null, hero: null });
  const [message, setMessage] = useState(initialMessage);

  const isBusy = isSaving || isUploading;
  const previewStyle = useMemo<PreviewStyle>(
    () => ({
      '--preview-primary': settings.brand_primary_color,
      '--preview-secondary': settings.brand_secondary_color,
    }),
    [settings.brand_primary_color, settings.brand_secondary_color]
  );

  function updateField(field: keyof UpdateSiteSettingsInput, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function saveSettings() {
    setMessage(initialMessage);
    startSaveTransition(async () => {
      const result = await updateSiteSettings(settings);
      if (result.success) {
        setMessage({ type: 'success', text: 'تم حفظ إعدادات المحتوى بنجاح.' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  function uploadAsset(assetType: SiteAssetType) {
    const file = uploads[assetType];
    if (!file) {
      setMessage({ type: 'error', text: 'اختر صورة قبل الرفع.' });
      return;
    }

    const formData = new FormData();
    formData.set('assetType', assetType);
    formData.set('file', file);
    setMessage(initialMessage);

    startUploadTransition(async () => {
      const result = await uploadSiteAsset(formData);
      if (result.success) {
        setAssetUrls((current) => ({ ...current, [assetType]: result.url }));
        setMessage({ type: 'success', text: 'تم رفع الصورة بنجاح.' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700'
              : 'border-red-400/30 bg-red-400/10 text-red-600'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <section className="rounded-lg border border-black/10 bg-[var(--cms-surface)] p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <Palette className="h-4 w-4 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">النصوص وألوان الهوية</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">عنوان الواجهة الرئيسية</span>
            <input
              type="text"
              value={settings.hero_title}
              onChange={(event) => updateField('hero_title', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">رقم الهاتف</span>
            <input
              type="tel"
              dir="ltr"
              value={settings.contact_phone}
              onChange={(event) => updateField('contact_phone', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">نص التعريف بالخدمة</span>
            <textarea
              rows={4}
              value={settings.about_text}
              onChange={(event) => updateField('about_text', event.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
            <input
              type="email"
              dir="ltr"
              value={settings.contact_email}
              onChange={(event) => updateField('contact_email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">اللون الأساسي</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={
                    settings.brand_primary_color.startsWith('#')
                      ? settings.brand_primary_color
                      : '#800000'
                  }
                  onChange={(event) => updateField('brand_primary_color', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-300 bg-[var(--cms-surface)]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings.brand_primary_color}
                  onChange={(event) => updateField('brand_primary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">اللون الثانوي</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={
                    settings.brand_secondary_color.startsWith('#')
                      ? settings.brand_secondary_color
                      : '#050505'
                  }
                  onChange={(event) => updateField('brand_secondary_color', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-300 bg-[var(--cms-surface)]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings.brand_secondary_color}
                  onChange={(event) => updateField('brand_secondary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-black/10 p-4" style={previewStyle}>
          <div className="h-2 rounded-full bg-[var(--preview-primary)]" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-900">معاينة الهوية</span>
            <span
              className="rounded-lg bg-[var(--preview-secondary)] px-3 py-1 text-xs text-slate-900"
              dir="ltr"
            >
              {settings.brand_primary_color}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isBusy}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الإعدادات
        </button>
      </section>

      <section className="rounded-lg border border-black/10 bg-[var(--cms-surface)] p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">الصور والهوية البصرية</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(['logo', 'hero'] as const).map((assetType) => {
            const title = assetType === 'logo' ? 'شعار الموقع' : 'صورة الواجهة الرئيسية';
            const previewUrl = assetUrls[assetType];

            return (
              <div key={assetType} className="rounded-lg border border-slate-300 bg-[var(--cms-surface)]/70 p-4">
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-[var(--cms-surface-strong)]">
                  {previewUrl ? (
                    <img src={previewUrl} alt={`معاينة ${title}`} className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-600" />
                  )}
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{title}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setUploads((current) => ({
                        ...current,
                        [assetType]: event.target.files?.[0] ?? null,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-[var(--cms-surface)] px-3 py-2 text-sm text-slate-700 file:mr-3 file:max-w-full file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-slate-900"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => uploadAsset(assetType)}
                  disabled={isBusy}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  رفع الصورة
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-black/10 bg-[var(--cms-surface)] p-4 sm:p-5">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">إدارة الأسطول والأسعار</h2>
            <p className="mt-1 text-sm text-slate-500">
              السيارات المعروضة للعملاء وفي الحجز تُدار الآن من صفحة الأسطول الموحّدة. أي تعديل هناك
              يظهر فوراً في كل مكان، والأسعار تُضبط حسب المسار والفئة من صفحة التسعير.
            </p>
          </div>
          <a
            href="/admin/cars"
            className="btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm font-bold"
          >
            <Car className="h-4 w-4" />
            الذهاب إلى إدارة الأسطول
          </a>
        </div>
      </section>
    </div>
  );
}
