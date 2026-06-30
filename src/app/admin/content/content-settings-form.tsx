'use client';

import { useMemo, useState, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Palette,
  Save,
  Upload,
} from 'lucide-react';
import { updateSiteSettings, uploadSiteAsset } from '@/app/actions/cms';
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

export default function ContentSettingsForm({ initialSettings }: ContentSettingsFormProps) {
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
        setMessage({ type: 'success', text: 'Settings saved.' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    });
  }

  function uploadAsset(assetType: SiteAssetType) {
    const file = uploads[assetType];
    if (!file) {
      setMessage({ type: 'error', text: 'Choose an image before uploading.' });
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
        setMessage({ type: 'success', text: 'Image uploaded.' });
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
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-red-400/30 bg-red-400/10 text-red-300'
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

      <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-5 flex items-center gap-2">
          <Palette className="h-4 w-4 text-rose-300" />
          <h2 className="text-lg font-semibold text-white">Text and Brand Colors</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Hero Title</span>
            <input
              type="text"
              value={settings.hero_title}
              onChange={(event) => updateField('hero_title', event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Contact Phone</span>
            <input
              type="tel"
              value={settings.contact_phone}
              onChange={(event) => updateField('contact_phone', event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-slate-300">About Us Text</span>
            <textarea
              rows={4}
              value={settings.about_text}
              onChange={(event) => updateField('about_text', event.target.value)}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-300">Contact Email</span>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(event) => updateField('contact_email', event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Primary Brand Color</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.brand_primary_color.startsWith('#') ? settings.brand_primary_color : '#800000'}
                  onChange={(event) => updateField('brand_primary_color', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-950"
                />
                <input
                  type="text"
                  value={settings.brand_primary_color}
                  onChange={(event) => updateField('brand_primary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-300">Secondary Brand Color</span>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.brand_secondary_color.startsWith('#') ? settings.brand_secondary_color : '#050505'}
                  onChange={(event) => updateField('brand_secondary_color', event.target.value)}
                  className="h-10 w-12 rounded-lg border border-slate-700 bg-slate-950"
                />
                <input
                  type="text"
                  value={settings.brand_secondary_color}
                  onChange={(event) => updateField('brand_secondary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-rose-400"
                />
              </div>
            </label>
          </div>
        </div>

        <div
          className="mt-5 rounded-lg border border-white/10 p-4"
          style={previewStyle}
        >
          <div className="h-2 rounded-full bg-[var(--preview-primary)]" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-white">Brand Preview</span>
            <span className="rounded-lg bg-[var(--preview-secondary)] px-3 py-1 text-xs text-white">
              {settings.brand_primary_color}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isBusy}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </section>

      <section className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-5 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-rose-300" />
          <h2 className="text-lg font-semibold text-white">Visual Assets</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(['logo', 'hero'] as const).map((assetType) => {
            const title = assetType === 'logo' ? 'Site Logo' : 'Hero Background';
            const previewUrl = assetUrls[assetType];

            return (
              <div key={assetType} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                  {previewUrl ? (
                    <img src={previewUrl} alt={`${title} preview`} className="h-full w-full object-contain" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-slate-600" />
                  )}
                </div>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-300">{title}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setUploads((current) => ({
                        ...current,
                        [assetType]: event.target.files?.[0] ?? null,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-sm file:text-white"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => uploadAsset(assetType)}
                  disabled={isBusy}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
