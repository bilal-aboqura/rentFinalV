'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type {
  BankAccount,
  CreateHomepagePriceCardInput,
  HospitalityOption,
  HomepagePriceCard,
  SaveBankAccountInput,
  SaveHospitalityOptionInput,
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
type BankAccountActionResult =
  | { success: true; data: BankAccount }
  | { success: false; error: string };
type BankAccountDeleteResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };
type HospitalityOptionActionResult =
  | { success: true; data: HospitalityOption }
  | { success: false; error: string };
type HospitalityOptionDeleteResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  hero_title: 'خدمة نقل مميزة من وإلى المطار',
  about_text: 'نوفر خدمة نقل احترافية بسائقين موثوقين وتجربة حجز عربية واضحة وأنيقة.',
  contact_phone: '+1 (555) 019-9000',
  contact_email: 'contact@rentfinal.com',
  brand_primary_color: '#0F6B7A',
  brand_secondary_color: '#B8862F',
  hero_image_url: null,
  site_logo_url: null,
  bank_name: 'Al Rajhi Bank',
  account_holder_name: 'Airport Transfer Co.',
  iban: 'SA00 0000 0000 0000 0000',
  bank_qr_url: null,
  whatsapp_number: '201102770678',
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
    bank_name: typeof value.bank_name === 'string' ? value.bank_name : DEFAULT_SITE_SETTINGS.bank_name,
    account_holder_name:
      typeof value.account_holder_name === 'string'
        ? value.account_holder_name
        : DEFAULT_SITE_SETTINGS.account_holder_name,
    iban: typeof value.iban === 'string' ? value.iban : DEFAULT_SITE_SETTINGS.iban,
    bank_qr_url: asNullableString(value.bank_qr_url),
    whatsapp_number:
      typeof value.whatsapp_number === 'string'
        ? value.whatsapp_number
        : DEFAULT_SITE_SETTINGS.whatsapp_number,
    updated_at: value.updated_at,
  };
}

function isColorValue(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value) || CSS_COLOR_NAME_PATTERN.test(value);
}

function validateSettingsInput(input: UpdateSiteSettingsInput): string | null {
  const requiredFields = [
    'hero_title',
    'about_text',
    'contact_phone',
    'contact_email',
    'brand_primary_color',
    'brand_secondary_color',
  ] as const;

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

function toBankAccount(value: unknown): BankAccount | null {
  if (!isRecord(value)) return null;

  const sortOrder =
    typeof value.sort_order === 'number' ? value.sort_order : Number(value.sort_order);

  if (
    typeof value.id !== 'string' ||
    typeof value.bank_name !== 'string' ||
    typeof value.account_holder_name !== 'string' ||
    typeof value.iban !== 'string' ||
    Number.isNaN(sortOrder) ||
    typeof value.is_active !== 'boolean' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    bank_name: value.bank_name,
    account_holder_name: value.account_holder_name,
    iban: value.iban,
    qr_url: asNullableString(value.qr_url),
    sort_order: sortOrder,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

function toHospitalityOption(value: unknown): HospitalityOption | null {
  if (!isRecord(value)) return null;

  const sortOrder =
    typeof value.sort_order === 'number' ? value.sort_order : Number(value.sort_order);

  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.name_ar !== 'string' ||
    Number.isNaN(sortOrder) ||
    typeof value.is_active !== 'boolean' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    name_ar: value.name_ar,
    sort_order: sortOrder,
    is_active: value.is_active,
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

async function fetchBankAccounts(activeOnly = false): Promise<BankAccount[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('bank_accounts')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) return [];

    const accounts = (data ?? [])
      .map((item) => toBankAccount(item))
      .filter((item): item is BankAccount => item !== null);

    if (accounts.length > 0 || !activeOnly) return accounts;

    const settings = await fetchSiteSettings();
    return [
      {
        id: 'site-settings-default',
        bank_name: settings.bank_name,
        account_holder_name: settings.account_holder_name,
        iban: settings.iban,
        qr_url: settings.bank_qr_url,
        sort_order: 1,
        is_active: true,
        created_at: settings.updated_at,
        updated_at: settings.updated_at,
      },
    ];
  } catch {
    return [];
  }
}

async function fetchHospitalityOptions(activeOnly = false): Promise<HospitalityOption[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('hospitality_options')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) return [];

    return (data ?? [])
      .map((item) => toHospitalityOption(item))
      .filter((item): item is HospitalityOption => item !== null);
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

export async function getBankAccountsAction(): Promise<BankAccount[]> {
  return fetchBankAccounts(false);
}

export async function getHospitalityOptionsAction(): Promise<HospitalityOption[]> {
  return fetchHospitalityOptions(false);
}

export async function getPublicHospitalityOptionsAction(): Promise<HospitalityOption[]> {
  return fetchHospitalityOptions(true);
}

/**
 * Public: bank transfer details for the booking payment step.
 * Safe to expose under RLS (public SELECT on site_settings).
 */
export async function getPublicBankDetailsAction(): Promise<{
  bank_name: string;
  account_holder_name: string;
  iban: string;
  bank_qr_url: string | null;
  accounts: BankAccount[];
}> {
  const settings = await fetchSiteSettings();
  const accounts = await fetchBankAccounts(true);
  return {
    bank_name: settings.bank_name,
    account_holder_name: settings.account_holder_name,
    iban: settings.iban,
    bank_qr_url: settings.bank_qr_url,
    accounts,
  };
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

/**
 * Admin: update bank transfer + WhatsApp details shown on the booking flow.
 */
export async function updateBankDetailsAction(input: {
  bank_name: string;
  account_holder_name: string;
  iban: string;
  bank_qr_url?: string;
  whatsapp_number: string;
}): Promise<CmsActionResult> {
  if (!input.bank_name.trim() || !input.account_holder_name.trim() || !input.iban.trim()) {
    return { success: false, error: 'يرجى تعبئة جميع حقول البنك.' };
  }
  try {
    const supabase = await createClient();
    const existing = await fetchSiteSettings();
    const payload: SiteSettings = {
      ...existing,
      id: SITE_SETTINGS_ID,
      bank_name: input.bank_name.trim(),
      account_holder_name: input.account_holder_name.trim(),
      iban: input.iban.trim(),
      bank_qr_url: input.bank_qr_url?.trim() || null,
      whatsapp_number: input.whatsapp_number.trim() || existing.whatsapp_number,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, error: `تعذر حفظ بيانات البنك: ${error.message}` };
    }
    revalidateCmsSurfaces();
    return { success: true };
  } catch {
    return { success: false, error: 'تعذر حفظ بيانات البنك.' };
  }
}

function validateBankAccountInput(input: SaveBankAccountInput): string | null {
  if (!input.bank_name.trim() || !input.account_holder_name.trim() || !input.iban.trim()) {
    return 'يرجى تعبئة اسم البنك واسم صاحب الحساب ورقم الآيبان.';
  }
  return null;
}

function validateHospitalityOptionInput(input: SaveHospitalityOptionInput): string | null {
  if (!input.name.trim() || !input.name_ar.trim()) {
    return 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ø§Ù„Ø¶ÙŠØ§ÙØ© Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.';
  }

  if (
    input.sort_order !== undefined &&
    (!Number.isInteger(input.sort_order) || input.sort_order < 0)
  ) {
    return 'ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¸Ù‡ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ù‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§ ØµÙØ±Ù‹Ø§ Ø£Ùˆ Ø£ÙƒØ¨Ø±.';
  }

  return null;
}

export async function saveBankAccountAction(
  input: SaveBankAccountInput,
): Promise<BankAccountActionResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  const validationError = validateBankAccountInput(input);
  if (validationError) return { success: false, error: validationError };

  try {
    const supabase = await createClient();
    const payload = {
      bank_name: input.bank_name.trim(),
      account_holder_name: input.account_holder_name.trim(),
      iban: input.iban.trim(),
      qr_url: input.qr_url?.trim() || null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const query = input.id && isUuid(input.id)
      ? supabase.from('bank_accounts').update(payload).eq('id', input.id)
      : supabase.from('bank_accounts').insert(payload);

    const { data, error } = await query.select('*').single();
    if (error || !data) {
      return { success: false, error: error?.message ?? 'تعذر حفظ الحساب البنكي.' };
    }

    const account = toBankAccount(data);
    if (!account) return { success: false, error: 'تم الحفظ لكن تعذرت قراءة بيانات الحساب.' };

    revalidateCmsSurfaces();
    return { success: true, data: account };
  } catch {
    return { success: false, error: 'تعذر حفظ الحساب البنكي.' };
  }
}

export async function deleteBankAccountAction(id: string): Promise<BankAccountDeleteResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  if (!isUuid(id)) {
    return { success: false, error: 'معرف الحساب البنكي غير صالح.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'تعذر حذف الحساب البنكي.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: { id: data.id as string } };
  } catch {
    return { success: false, error: 'تعذر حذف الحساب البنكي.' };
  }
}

export async function saveHospitalityOptionAction(
  input: SaveHospitalityOptionInput,
): Promise<HospitalityOptionActionResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  const validationError = validateHospitalityOptionInput(input);
  if (validationError) return { success: false, error: validationError };

  try {
    const supabase = await createClient();
    const payload = {
      name: input.name.trim(),
      name_ar: input.name_ar.trim(),
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const query =
      input.id && isUuid(input.id)
        ? supabase.from('hospitality_options').update(payload).eq('id', input.id)
        : supabase.from('hospitality_options').insert(payload);

    const { data, error } = await query.select('*').single();
    if (error || !data) {
      return { success: false, error: error?.message ?? 'ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø®ÙŠØ§Ø± Ø§Ù„Ø¶ÙŠØ§ÙØ©.' };
    }

    const option = toHospitalityOption(data);
    if (!option) {
      return { success: false, error: 'ØªÙ… Ø§Ù„Ø­ÙØ¸ Ù„ÙƒÙ† ØªØ¹Ø°Ø±Øª Ù‚Ø±Ø§Ø¡Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¶ÙŠØ§ÙØ©.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: option };
  } catch {
    return { success: false, error: 'ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø®ÙŠØ§Ø± Ø§Ù„Ø¶ÙŠØ§ÙØ©.' };
  }
}

export async function deleteHospitalityOptionAction(
  id: string,
): Promise<HospitalityOptionDeleteResult> {
  const authResult = await requireAuthenticatedUser();
  if (!authResult.success) return authResult;

  if (!isUuid(id)) {
    return { success: false, error: 'Ù…Ø¹Ø±Ù Ø®ÙŠØ§Ø± Ø§Ù„Ø¶ÙŠØ§ÙØ© ØºÙŠØ± ØµØ§Ù„Ø­.' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('hospitality_options')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'ØªØ¹Ø°Ø± Ø­Ø°Ù Ø®ÙŠØ§Ø± Ø§Ù„Ø¶ÙŠØ§ÙØ©.' };
    }

    revalidateCmsSurfaces();
    return { success: true, data: { id: data.id as string } };
  } catch {
    return { success: false, error: 'ØªØ¹Ø°Ø± Ø­Ø°Ù Ø®ÙŠØ§Ø± Ø§Ù„Ø¶ÙŠØ§ÙØ©.' };
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
