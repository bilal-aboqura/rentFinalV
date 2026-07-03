'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type {
  CreateHomepagePriceCardInput,
  HomepagePriceCard,
  SiteAssetType,
  SiteSettings,
  UpdateHomepagePriceCardInput,
  UpdateSiteSettingsInput,
} from '@/types';

const SITE_SETTINGS_ID = 1;
const PUBLIC_ASSETS_BUCKET = 'public_assets';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

type CmsActionResult = { success: true } | { success: false; error: string };
type UploadSiteAssetResult =
  | { success: true; url: string }
  | { success: false; error: string };
type HomepagePriceCardActionResult =
  | { success: true; data: HomepagePriceCard }
  | { success: false; error: string };
type HomepagePriceCardDeleteResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };
type UploadHomepagePriceCardImageResult =
  | { success: true; data: HomepagePriceCard }
  | { success: false; error: string };

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  hero_title: 'خدمة نقل مميزة من وإلى المطار',
  about_text: 'نوفر خدمة نقل احترافية بسائقين موثوقين وتجربة حجز عربية واضحة وأنيقة.',
  contact_phone: '+1 (555) 019-9000',
  contact_email: 'contact@rentfinal.com',
  brand_primary_color: '#50A6B9',
  brand_secondary_color: '#C3A16F',
  hero_image_url: null,
  site_logo_url: null,
  updated_at: '1970-01-01T00:00:00.000Z',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const CSS_COLOR_NAME_PATTERN = /^[a-zA-Z][a-zA-Z\s-]*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEGACY_HERO_TITLES = new Set([
  'Premium Car Rentals & Airport Transfers',
  'Premium Airport Transfers',
]);

const LEGACY_ABOUT_TEXTS = new Set([
  'We provide premier transport services with professional drivers.',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toSiteSettings(value: unknown): SiteSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.id !== SITE_SETTINGS_ID ||
    typeof value.hero_title !== 'string' ||
    typeof value.about_text !== 'string' ||
    typeof value.contact_phone !== 'string' ||
    typeof value.contact_email !== 'string' ||
    typeof value.brand_primary_color !== 'string' ||
    typeof value.brand_secondary_color !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    id: SITE_SETTINGS_ID,
    hero_title: value.hero_title,
    about_text: value.about_text,
    contact_phone: value.contact_phone,
    contact_email: value.contact_email,
    brand_primary_color: value.brand_primary_color,
    brand_secondary_color: value.brand_secondary_color,
    hero_image_url: asNullableString(value.hero_image_url),
    site_logo_url: asNullableString(value.site_logo_url),
    updated_at: value.updated_at,
  };
}

function isColorValue(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value) || CSS_COLOR_NAME_PATTERN.test(value);
}

function validateSettingsInput(input: UpdateSiteSettingsInput): string | null {
  const requiredFields: Array<keyof UpdateSiteSettingsInput> = [
    'hero_title',
    'about_text',
    'contact_phone',
    'contact_email',
    'brand_primary_color',
    'brand_secondary_color',
  ];

  for (const field of requiredFields) {
    if (input[field].trim().length === 0) {
      return 'All content and branding fields are required.';
    }
  }

  if (!EMAIL_PATTERN.test(input.contact_email.trim())) {
    return 'يرجى إدخال بريد إلكتروني صحيح للتواصل.';
  }

  if (
    !isColorValue(input.brand_primary_color.trim()) ||
    !isColorValue(input.brand_secondary_color.trim())
  ) {
    return 'ألوان الهوية يجب أن تكون صيغة لون صحيحة مثل hex أو اسم لون CSS معروف.';
  }

  return null;
}

function toHomepagePriceCard(value: unknown): HomepagePriceCard | null {
  if (!isRecord(value)) {
    return null;
  }

  const price = typeof value.price === 'number' ? value.price : Number(value.price);
  const sortOrder =
    typeof value.sort_order === 'number' ? value.sort_order : Number(value.sort_order);

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    Number.isNaN(price) ||
    typeof value.passenger_capacity !== 'number' ||
    Number.isNaN(sortOrder) ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    price,
    passenger_capacity: value.passenger_capacity,
    image_url: asNullableString(value.image_url),
    sort_order: sortOrder,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function localizeLegacySettings(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    hero_title: LEGACY_HERO_TITLES.has(settings.hero_title)
      ? DEFAULT_SITE_SETTINGS.hero_title
      : settings.hero_title,
    about_text: LEGACY_ABOUT_TEXTS.has(settings.about_text)
      ? DEFAULT_SITE_SETTINGS.about_text
      : settings.about_text,
  };
}

function extensionForMimeType(type: string): string {
  if (type === 'image/jpeg') {
    return 'jpg';
  }
  if (type === 'image/webp') {
    return 'webp';
  }
  return 'png';
}

function isSiteAssetType(value: FormDataEntryValue | null): value is SiteAssetType {
  return value === 'logo' || value === 'hero';
}

function isValidImageType(type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] {
  return ALLOWED_IMAGE_TYPES.some((allowedType) => allowedType === type);
}

function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { success: false as const, error: 'يجب تسجيل الدخول إلى لوحة الإدارة أولاً.' };
  }

  return { success: true as const };
}

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      return DEFAULT_SITE_SETTINGS;
    }

    return localizeLegacySettings(toSiteSettings(data) ?? DEFAULT_SITE_SETTINGS);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

async function fetchHomepagePriceCards(): Promise<HomepagePriceCard[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('homepage_price_cards')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    return (data ?? [])
      .map((item) => toHomepagePriceCard(item))
      .filter((item): item is HomepagePriceCard => item !== null);
  } catch {
    return [];
  }
}

async function ensurePublicAssetsBucket() {
  const serviceClient = await createServiceClient();
  const { data: buckets, error: listError } = await serviceClient.storage.listBuckets();
  if (listError) {
    return { success: false as const, error: listError.message };
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === PUBLIC_ASSETS_BUCKET);
  if (existingBucket) {
    return { success: true as const };
  }

  const { error: createError } = await serviceClient.storage.createBucket(PUBLIC_ASSETS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
  });

  if (createError) {
    return { success: false as const, error: createError.message };
  }

  return { success: true as const };
}

function revalidateCmsSurfaces() {
  revalidatePath('/');
  revalidatePath('/', 'layout');
  revalidatePath('/admin/content');
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return fetchSiteSettings();
}

export async function getHomepagePriceCards(): Promise<HomepagePriceCard[]> {
  return fetchHomepagePriceCards();
}

export async function updateSiteSettings(
  input: UpdateSiteSettingsInput
): Promise<CmsActionResult> {
  const validationError = validateSettingsInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabase = await createClient();
    const existingSettings = await fetchSiteSettings();

    const payload: SiteSettings = {
      ...existingSettings,
      ...input,
      id: SITE_SETTINGS_ID,
      hero_title: input.hero_title.trim(),
      about_text: input.about_text.trim(),
      contact_phone: input.contact_phone.trim(),
      contact_email: input.contact_email.trim(),
      brand_primary_color: input.brand_primary_color.trim(),
      brand_secondary_color: input.brand_secondary_color.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { success: false, error: `تعذر حفظ إعدادات الموقع: ${error.message}` };
    }

    revalidateCmsSurfaces();
    return { success: true };
  } catch {
    return { success: false, error: 'تعذر حفظ إعدادات الموقع.' };
  }
}

export async function uploadSiteAsset(formData: FormData): Promise<UploadSiteAssetResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) {
    return authResult;
  }

  const assetType = formData.get('assetType');
  const file = formData.get('file');

  if (!isSiteAssetType(assetType)) {
    return { success: false, error: 'نوع الملف يجب أن يكون شعارًا أو صورة رئيسية.' };
  }

  if (!(file instanceof File)) {
    return { success: false, error: 'يرجى اختيار صورة لرفعها.' };
  }

  if (!isValidImageType(file.type)) {
    return { success: false, error: 'الصور يجب أن تكون بصيغة PNG أو JPG أو WebP.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: 'يجب ألا يزيد حجم الصورة عن 5 ميجابايت.' };
  }

  const extension = extensionForMimeType(file.type);
  const path =
    assetType === 'logo'
      ? `branding/site-logo.${extension}`
      : `branding/hero-background.${extension}`;
  const updateColumn = assetType === 'logo' ? 'site_logo_url' : 'hero_image_url';

  try {
    const bucketResult = await ensurePublicAssetsBucket();
    if (!bucketResult.success) {
      return {
        success: false,
        error: `تعذر تجهيز مساحة تخزين الصور: ${bucketResult.error}`,
      };
    }

    const serviceClient = await createServiceClient();
    const bucket = serviceClient.storage.from(PUBLIC_ASSETS_BUCKET);
    const { error: uploadError } = await bucket.upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: `تعذر رفع الصورة: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(path);
    const versionedPublicUrl = withCacheBust(publicUrl);

    const { data: existingSettings, error: existingSettingsError } = await serviceClient
      .from('site_settings')
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle();

    if (existingSettingsError) {
      return {
        success: false,
        error: `تعذر تحميل إعدادات الموقع الحالية قبل حفظ الصورة: ${existingSettingsError.message}`,
      };
    }

    const mergedSettings: SiteSettings = {
      ...(toSiteSettings(existingSettings) ?? DEFAULT_SITE_SETTINGS),
      id: SITE_SETTINGS_ID,
      [updateColumn]: versionedPublicUrl,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await serviceClient
      .from('site_settings')
      .upsert(mergedSettings, { onConflict: 'id' })
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `تعذر حفظ رابط الصورة المرفوعة: ${updateError.message}` };
    }

    revalidateCmsSurfaces();
    return { success: true, url: versionedPublicUrl };
  } catch {
    return { success: false, error: 'تعذر رفع الصورة.' };
  }
}

function validateHomepagePriceCardInput(
  input: CreateHomepagePriceCardInput | UpdateHomepagePriceCardInput
): string | null {
  if (input.name.trim().length === 0) {
    return 'اسم العنصر مطلوب.';
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    return 'السعر يجب أن يكون رقماً صحيحاً أو عشرياً أكبر من أو يساوي صفر.';
  }

  if (!Number.isInteger(input.passenger_capacity) || input.passenger_capacity < 1) {
    return 'عدد الأفراد يجب أن يكون رقمًا صحيحًا أكبر من صفر.';
  }

  return null;
}

export async function createHomepagePriceCard(
  input: CreateHomepagePriceCardInput
): Promise<HomepagePriceCardActionResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) {
    return authResult;
  }

  const validationError = validateHomepagePriceCardInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const serviceClient = await createServiceClient();
    const existingCards = await fetchHomepagePriceCards();
    const nextSortOrder =
      existingCards.length === 0
        ? 0
        : Math.max(...existingCards.map((card) => card.sort_order)) + 1;

    const { data, error } = await serviceClient
      .from('homepage_price_cards')
      .insert({
        name: input.name.trim(),
        price: input.price,
        passenger_capacity: input.passenger_capacity,
        sort_order: nextSortOrder,
      })
      .select('*')
      .single();

    if (error) {
      return { success: false, error: `تعذر إضافة عنصر الأسعار: ${error.message}` };
    }

    const card = toHomepagePriceCard(data);
    if (!card) {
      return { success: false, error: 'تم إنشاء العنصر لكن تعذر قراءة بياناته.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: card };
  } catch {
    return { success: false, error: 'تعذر إضافة عنصر الأسعار.' };
  }
}

export async function updateHomepagePriceCard(
  input: UpdateHomepagePriceCardInput
): Promise<HomepagePriceCardActionResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) {
    return authResult;
  }

  if (!isUuid(input.id)) {
    return { success: false, error: 'معرف عنصر الأسعار غير صالح.' };
  }

  const validationError = validateHomepagePriceCardInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from('homepage_price_cards')
      .update({
        name: input.name.trim(),
        price: input.price,
        passenger_capacity: input.passenger_capacity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: `تعذر تحديث عنصر الأسعار: ${error.message}` };
    }

    const card = toHomepagePriceCard(data);
    if (!card) {
      return { success: false, error: 'تم تحديث العنصر لكن تعذر قراءة بياناته.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: card };
  } catch {
    return { success: false, error: 'تعذر تحديث عنصر الأسعار.' };
  }
}

export async function deleteHomepagePriceCard(
  id: string
): Promise<HomepagePriceCardDeleteResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) {
    return authResult;
  }

  if (!isUuid(id)) {
    return { success: false, error: 'معرف عنصر الأسعار غير صالح.' };
  }

  try {
    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient
      .from('homepage_price_cards')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `تعذر حذف عنصر الأسعار${error?.message ? `: ${error.message}` : '.'}`,
      };
    }

    revalidateCmsSurfaces();
    return { success: true, data: { id: data.id as string } };
  } catch {
    return { success: false, error: 'تعذر حذف عنصر الأسعار.' };
  }
}

export async function uploadHomepagePriceCardImage(
  cardId: string,
  formData: FormData
): Promise<UploadHomepagePriceCardImageResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) {
    return authResult;
  }

  if (!isUuid(cardId)) {
    return { success: false, error: 'معرف عنصر الأسعار غير صالح.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'يرجى اختيار صورة قبل الرفع.' };
  }

  if (!isValidImageType(file.type)) {
    return { success: false, error: 'الصور يجب أن تكون بصيغة PNG أو JPG أو WebP.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: 'يجب ألا يزيد حجم الصورة عن 5 ميجابايت.' };
  }

  try {
    const bucketResult = await ensurePublicAssetsBucket();
    if (!bucketResult.success) {
      return {
        success: false,
        error: `تعذر تجهيز مساحة تخزين الصور: ${bucketResult.error}`,
      };
    }

    const extension = extensionForMimeType(file.type);
    const storagePath = `pricing-cards/${cardId}.${extension}`;
    const serviceClient = await createServiceClient();
    const bucket = serviceClient.storage.from(PUBLIC_ASSETS_BUCKET);
    const { error: uploadError } = await bucket.upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: `تعذر رفع الصورة: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(storagePath);
    const versionedPublicUrl = withCacheBust(publicUrl);

    const { data, error } = await serviceClient
      .from('homepage_price_cards')
      .update({
        image_url: versionedPublicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: `تعذر حفظ رابط الصورة: ${error.message}` };
    }

    const card = toHomepagePriceCard(data);
    if (!card) {
      return { success: false, error: 'تم رفع الصورة لكن تعذر قراءة بيانات العنصر.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: card };
  } catch {
    return { success: false, error: 'تعذر رفع صورة عنصر الأسعار.' };
  }
}
