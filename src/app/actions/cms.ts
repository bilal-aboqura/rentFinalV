'use server';

import { unstable_cache, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { SiteAssetType, SiteSettings, UpdateSiteSettingsInput } from '@/types';

const CMS_CACHE_TAG = 'cms-settings';
const SITE_SETTINGS_ID = 1;
const PUBLIC_ASSETS_BUCKET = 'public_assets';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

type CmsActionResult = { success: true } | { success: false; error: string };
type UploadSiteAssetResult =
  | { success: true; url: string }
  | { success: false; error: string };

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  hero_title: 'Premium Car Rentals & Airport Transfers',
  about_text: 'We provide premier transport services with professional drivers.',
  contact_phone: '+1 (555) 019-9000',
  contact_email: 'contact@rentfinal.com',
  brand_primary_color: '#800000',
  brand_secondary_color: '#050505',
  hero_image_url: null,
  site_logo_url: null,
  updated_at: '1970-01-01T00:00:00.000Z',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const CSS_COLOR_NAME_PATTERN = /^[a-zA-Z][a-zA-Z\s-]*$/;

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
    return 'Please enter a valid contact email address.';
  }

  if (
    !isColorValue(input.brand_primary_color.trim()) ||
    !isColorValue(input.brand_secondary_color.trim())
  ) {
    return 'Brand colors must be valid hex codes or standard CSS color names.';
  }

  return null;
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

    return toSiteSettings(data) ?? DEFAULT_SITE_SETTINGS;
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

const getCachedSiteSettings = unstable_cache(fetchSiteSettings, [CMS_CACHE_TAG], {
  tags: [CMS_CACHE_TAG],
});

export async function getSiteSettings(): Promise<SiteSettings> {
  return getCachedSiteSettings();
}

export async function updateSiteSettings(
  input: UpdateSiteSettingsInput
): Promise<CmsActionResult> {
  const validationError = validateSettingsInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const payload: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
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

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('site_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { success: false, error: `Failed to save site settings: ${error.message}` };
    }

    revalidateTag(CMS_CACHE_TAG, 'max');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to save site settings.' };
  }
}

export async function uploadSiteAsset(formData: FormData): Promise<UploadSiteAssetResult> {
  const assetType = formData.get('assetType');
  const file = formData.get('file');

  if (!isSiteAssetType(assetType)) {
    return { success: false, error: 'Asset type must be logo or hero.' };
  }

  if (!(file instanceof File)) {
    return { success: false, error: 'Please select an image file to upload.' };
  }

  if (!isValidImageType(file.type)) {
    return { success: false, error: 'Images must be PNG, JPG, or WebP files.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: 'Images must be 5MB or smaller.' };
  }

  const extension = extensionForMimeType(file.type);
  const path =
    assetType === 'logo'
      ? `branding/site-logo.${extension}`
      : `branding/hero-background.${extension}`;
  const updateColumn = assetType === 'logo' ? 'site_logo_url' : 'hero_image_url';

  try {
    const supabase = await createClient();
    const bucket = supabase.storage.from(PUBLIC_ASSETS_BUCKET);
    const { error: uploadError } = await bucket.upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return { success: false, error: `Failed to upload image: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = bucket.getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ [updateColumn]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', SITE_SETTINGS_ID)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: `Failed to save uploaded image URL: ${updateError.message}` };
    }

    revalidateTag(CMS_CACHE_TAG, 'max');
    return { success: true, url: publicUrl };
  } catch {
    return { success: false, error: 'Failed to upload image.' };
  }
}
