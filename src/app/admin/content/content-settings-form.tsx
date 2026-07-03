'use client';

import { useMemo, useState, useTransition, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Palette,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  createHomepagePriceCard,
  deleteHomepagePriceCard,
  updateHomepagePriceCard,
  updateSiteSettings,
  uploadHomepagePriceCardImage,
  uploadSiteAsset,
} from '@/app/actions/cms';
import type { HomepagePriceCard, SiteAssetType, SiteSettings, UpdateSiteSettingsInput } from '@/types';

interface ContentSettingsFormProps {
  initialSettings: SiteSettings;
  initialPriceCards: HomepagePriceCard[];
}

type UploadState = {
  logo: File | null;
  hero: File | null;
};

type EditableHomepagePriceCard = {
  id: string;
  name: string;
  price: string;
  passenger_capacity: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const initialMessage = { type: '', text: '' };
const initialNewPriceCard = { name: '', price: '', passenger_capacity: '4' };

type PreviewStyle = CSSProperties & {
  '--preview-primary': string;
  '--preview-secondary': string;
};

function toEditableHomepagePriceCard(card: HomepagePriceCard): EditableHomepagePriceCard {
  return {
    ...card,
    price: String(card.price),
    passenger_capacity: String(card.passenger_capacity),
  };
}

function parsePriceInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parsePassengerCapacityInput(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

export default function ContentSettingsForm({
  initialSettings,
  initialPriceCards,
}: ContentSettingsFormProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isManagingCards, startCardsTransition] = useTransition();
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
  const [priceCards, setPriceCards] = useState(
    initialPriceCards.map((card) => toEditableHomepagePriceCard(card))
  );
  const [newPriceCard, setNewPriceCard] = useState(initialNewPriceCard);
  const [newPriceCardImage, setNewPriceCardImage] = useState<File | null>(null);
  const [activeCardAction, setActiveCardAction] = useState<string | null>(null);
  const [message, setMessage] = useState(initialMessage);

  const isBusy = isSaving || isUploading || isManagingCards;
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

  function updatePriceCardField(
    cardId: string,
    field: keyof Pick<EditableHomepagePriceCard, 'name' | 'price' | 'passenger_capacity'>,
    value: string
  ) {
    setPriceCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, [field]: value } : card))
    );
  }

  function replacePriceCard(nextCard: HomepagePriceCard) {
    setPriceCards((current) =>
      current.map((card) =>
        card.id === nextCard.id ? toEditableHomepagePriceCard(nextCard) : card
      )
    );
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

  function saveExistingPriceCard(cardId: string) {
    const targetCard = priceCards.find((card) => card.id === cardId);
    if (!targetCard) {
      setMessage({ type: 'error', text: 'تعذر العثور على العنصر المطلوب.' });
      return;
    }

    const parsedPrice = parsePriceInput(targetCard.price);
    if (parsedPrice === null) {
      setMessage({ type: 'error', text: 'يرجى إدخال سعر صحيح أكبر من أو يساوي صفر.' });
      return;
    }

    const parsedPassengerCapacity = parsePassengerCapacityInput(targetCard.passenger_capacity);
    if (parsedPassengerCapacity === null) {
      setMessage({ type: 'error', text: 'يرجى إدخال عدد أفراد صحيح أكبر من صفر.' });
      return;
    }

    setMessage(initialMessage);
    setActiveCardAction(`save-${cardId}`);

    startCardsTransition(async () => {
      const result = await updateHomepagePriceCard({
        id: targetCard.id,
        name: targetCard.name,
        price: parsedPrice,
        passenger_capacity: parsedPassengerCapacity,
      });

      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
        setActiveCardAction(null);
        return;
      }

      replacePriceCard(result.data);
      setMessage({ type: 'success', text: 'تم حفظ بيانات العنصر بنجاح.' });
      setActiveCardAction(null);
      router.refresh();
    });
  }

  function uploadExistingPriceCardImage(cardId: string, file: File | null) {
    if (!file) {
      return;
    }

    setMessage(initialMessage);
    setActiveCardAction(`upload-image-${cardId}`);

    startCardsTransition(async () => {
      const formData = new FormData();
      formData.set('file', file);
      const result = await uploadHomepagePriceCardImage(cardId, formData);

      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
        setActiveCardAction(null);
        return;
      }

      replacePriceCard(result.data);
      setMessage({ type: 'success', text: 'تم تحديث صورة العنصر بنجاح.' });
      setActiveCardAction(null);
      router.refresh();
    });
  }

  function createPriceCard() {
    const parsedPrice = parsePriceInput(newPriceCard.price);
    if (parsedPrice === null) {
      setMessage({ type: 'error', text: 'يرجى إدخال سعر صحيح قبل إضافة العنصر.' });
      return;
    }

    const parsedPassengerCapacity = parsePassengerCapacityInput(newPriceCard.passenger_capacity);
    if (parsedPassengerCapacity === null) {
      setMessage({ type: 'error', text: 'يرجى إدخال عدد أفراد صحيح قبل إضافة العنصر.' });
      return;
    }

    setMessage(initialMessage);
    setActiveCardAction('create-card');

    startCardsTransition(async () => {
      const createResult = await createHomepagePriceCard({
        name: newPriceCard.name,
        price: parsedPrice,
        passenger_capacity: parsedPassengerCapacity,
      });

      if (!createResult.success) {
        setMessage({ type: 'error', text: createResult.error });
        setActiveCardAction(null);
        return;
      }

      let nextCard = createResult.data;

      if (newPriceCardImage) {
        const formData = new FormData();
        formData.set('file', newPriceCardImage);
        const uploadResult = await uploadHomepagePriceCardImage(nextCard.id, formData);

        if (!uploadResult.success) {
          setPriceCards((current) => [...current, toEditableHomepagePriceCard(nextCard)]);
          setMessage({
            type: 'error',
            text: `تمت إضافة العنصر لكن رفع الصورة فشل: ${uploadResult.error}`,
          });
          setNewPriceCard(initialNewPriceCard);
          setNewPriceCardImage(null);
          setActiveCardAction(null);
          router.refresh();
          return;
        }

        nextCard = uploadResult.data;
      }

      setPriceCards((current) => [...current, toEditableHomepagePriceCard(nextCard)]);
      setNewPriceCard(initialNewPriceCard);
      setNewPriceCardImage(null);
      setMessage({ type: 'success', text: 'تمت إضافة عنصر جديد إلى سيكشن الأسعار.' });
      setActiveCardAction(null);
      router.refresh();
    });
  }

  function removePriceCard(cardId: string) {
    setMessage(initialMessage);
    setActiveCardAction(`delete-${cardId}`);

    startCardsTransition(async () => {
      const result = await deleteHomepagePriceCard(cardId);
      if (!result.success) {
        setMessage({ type: 'error', text: result.error });
        setActiveCardAction(null);
        return;
      }

      setPriceCards((current) => current.filter((card) => card.id !== cardId));
      setMessage({ type: 'success', text: 'تم حذف العنصر.' });
      setActiveCardAction(null);
      router.refresh();
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

      <section className="rounded-lg border border-black/10 bg-[#E8F4F8]/70 p-4 sm:p-5">
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
              className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">رقم الهاتف</span>
            <input
              type="tel"
              dir="ltr"
              value={settings.contact_phone}
              onChange={(event) => updateField('contact_phone', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">نص التعريف بالخدمة</span>
            <textarea
              rows={4}
              value={settings.about_text}
              onChange={(event) => updateField('about_text', event.target.value)}
              className="w-full resize-none rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">البريد الإلكتروني</span>
            <input
              type="email"
              dir="ltr"
              value={settings.contact_email}
              onChange={(event) => updateField('contact_email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
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
                  className="h-10 w-12 rounded-lg border border-slate-300 bg-[#F0F8FA]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings.brand_primary_color}
                  onChange={(event) => updateField('brand_primary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
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
                  className="h-10 w-12 rounded-lg border border-slate-300 bg-[#F0F8FA]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={settings.brand_secondary_color}
                  onChange={(event) => updateField('brand_secondary_color', event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
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

      <section className="rounded-lg border border-black/10 bg-[#E8F4F8]/70 p-4 sm:p-5">
        <div className="mb-5 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-rose-500" />
          <h2 className="text-lg font-semibold text-slate-900">الصور والهوية البصرية</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {(['logo', 'hero'] as const).map((assetType) => {
            const title = assetType === 'logo' ? 'شعار الموقع' : 'صورة الواجهة الرئيسية';
            const previewUrl = assetUrls[assetType];

            return (
              <div key={assetType} className="rounded-lg border border-slate-300 bg-[#F0F8FA]/70 p-4">
                <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-[#E8F4F8]">
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
                    className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2 text-sm text-slate-700 file:mr-3 file:max-w-full file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-slate-900"
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

      <section className="rounded-lg border border-black/10 bg-[#E8F4F8]/70 p-4 sm:p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">سيكشن الأسطول والأسعار</h2>
            <p className="mt-1 text-sm text-slate-500">
              صورة العنصر الحالي يتم تحديثها فور اختيار الملف، أما الاسم والسعر وعدد الأفراد فلهم زر
              حفظ مستقل.
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {priceCards.length} عنصر
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {priceCards.map((card) => {
            const isSavingCard = activeCardAction === `save-${card.id}`;
            const isDeletingCard = activeCardAction === `delete-${card.id}`;
            const isUploadingCardImage = activeCardAction === `upload-image-${card.id}`;

            return (
              <div key={card.id} className="rounded-2xl border border-slate-300 bg-white/80 p-3 sm:p-4">
                <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs">لا توجد صورة مرفوعة</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">الاسم</span>
                    <input
                      type="text"
                      value={card.name}
                      onChange={(event) =>
                        updatePriceCardField(card.id, 'name', event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">السعر</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={card.price}
                      onChange={(event) =>
                        updatePriceCardField(card.id, 'price', event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">عدد الأفراد</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={card.passenger_capacity}
                      onChange={(event) =>
                        updatePriceCardField(card.id, 'passenger_capacity', event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">تغيير الصورة</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) =>
                        uploadExistingPriceCardImage(card.id, event.target.files?.[0] ?? null)
                      }
                      disabled={isBusy}
                      className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2 text-sm text-slate-700 file:mr-3 file:max-w-full file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="text-xs text-slate-500">
                      بمجرد اختيار الملف سيتم رفع الصورة الجديدة مباشرة.
                    </p>
                    {isUploadingCardImage && (
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-sky-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        جارٍ رفع الصورة...
                      </div>
                    )}
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={() => saveExistingPriceCard(card.id)}
                    disabled={isBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSavingCard ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    حفظ البيانات
                  </button>

                  <button
                    type="button"
                    onClick={() => removePriceCard(card.id)}
                    disabled={isBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isDeletingCard ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    حذف
                  </button>
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 sm:p-4">
            <div className="mb-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">إضافة عنصر جديد</span>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">الاسم</span>
                <input
                  type="text"
                  value={newPriceCard.name}
                  onChange={(event) =>
                    setNewPriceCard((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">السعر</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPriceCard.price}
                  onChange={(event) =>
                    setNewPriceCard((current) => ({ ...current, price: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">عدد الأفراد</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newPriceCard.passenger_capacity}
                  onChange={(event) =>
                    setNewPriceCard((current) => ({
                      ...current,
                      passenger_capacity: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">الصورة</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setNewPriceCardImage(event.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-slate-300 bg-[#F0F8FA] px-3 py-2 text-sm text-slate-700 file:mr-3 file:max-w-full file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-slate-900"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={createPriceCard}
              disabled={isBusy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {activeCardAction === 'create-card' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              إضافة العنصر
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
