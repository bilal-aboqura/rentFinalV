'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import { SiteSettings, UpdateSiteSettingsInput } from '@/types';

// Default configurations
const DEFAULT_SETTINGS: Omit<SiteSettings, 'id' | 'updated_at'> = {
  hero_title: 'Premium Car Rentals & Airport Transfers',
  about_text: 'We provide premier transport services with professional drivers.',
  contact_phone: '+1 (555) 019-9000',
  contact_email: 'contact@rentfinal.com',
  brand_primary_color: 'Maroon',
  brand_secondary_color: 'Royal Black',
  hero_image_url: null,
  site_logo_url: null,
};

const getErrorMessage = (err: unknown, fallback = 'An unexpected error occurred.') =>
  err instanceof Error ? err.message : fallback;

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      // PGRST116 means 0 rows returned
      if (error.code === 'PGRST116') {
        return {
          id: 1,
          ...DEFAULT_SETTINGS,
          updated_at: new Date().toISOString(),
        };
      }
      console.error('Error fetching site settings, falling back to defaults:', error);
      return {
        id: 1,
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      };
    }

    return data as SiteSettings;
  } catch (err) {
    console.error('Exception fetching site settings, falling back to defaults:', err);
    return {
      id: 1,
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateSiteSettings(
  input: UpdateSiteSettingsInput
): Promise<{ success: boolean; error?: string; validationErrors?: Record<string, string[]> }> {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated (admin)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return { success: false, error: 'Unauthorized: Admin access required.' };
    }

    // Input Validation
    const validationErrors: Record<string, string[]> = {};
    if (!input.hero_title || input.hero_title.trim() === '') {
      validationErrors.hero_title = ['Hero title is required.'];
    }
    if (!input.about_text || input.about_text.trim() === '') {
      validationErrors.about_text = ['About Us text is required.'];
    }
    if (!input.contact_phone || input.contact_phone.trim() === '') {
      validationErrors.contact_phone = ['Contact phone is required.'];
    }
    if (!input.contact_email || input.contact_email.trim() === '') {
      validationErrors.contact_email = ['Contact email is required.'];
    } else if (!/\S+@\S+\.\S+/.test(input.contact_email)) {
      validationErrors.contact_email = ['Contact email must be a valid email address.'];
    }
    if (!input.brand_primary_color || input.brand_primary_color.trim() === '') {
      validationErrors.brand_primary_color = ['Primary brand color is required.'];
    }
    if (!input.brand_secondary_color || input.brand_secondary_color.trim() === '') {
      validationErrors.brand_secondary_color = ['Secondary brand color is required.'];
    }

    if (Object.keys(validationErrors).length > 0) {
      return { success: false, validationErrors };
    }

    // Update settings (single row constraint ensures id = 1)
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({
        hero_title: input.hero_title,
        about_text: input.about_text,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email,
        brand_primary_color: input.brand_primary_color,
        brand_secondary_color: input.brand_secondary_color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating site settings:', updateError);
      return { success: false, error: updateError.message };
    }

    revalidateTag('cms-settings', 'max');
    return { success: true };
  } catch (err: unknown) {
    console.error('Exception updating site settings:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function uploadSiteAsset(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated (admin)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return { success: false, error: 'Unauthorized: Admin access required.' };
    }

    const file = formData.get('file') as File | null;
    const assetType = formData.get('assetType') as string | null;

    if (!file || !assetType || !['logo', 'hero'].includes(assetType)) {
      return { success: false, error: 'Invalid file upload parameters.' };
    }

    // Validation: Image format & size (max 5MB)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file format. Supported: PNG, JPG, JPEG, WebP.' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 5MB limit.' };
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${assetType}-${Date.now()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    // Read the file buffer for Node/Server upload compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage bucket 'public_assets'
    const { error: uploadError } = await supabase.storage
      .from('public_assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading asset to storage:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('public_assets')
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { success: false, error: 'Failed to retrieve asset public URL.' };
    }

    const publicUrl = publicUrlData.publicUrl;

    // Update settings table with new asset URL
    const updatePayload: Record<string, string> = {};
    if (assetType === 'logo') {
      updatePayload.site_logo_url = publicUrl;
    } else {
      updatePayload.hero_image_url = publicUrl;
    }

    const { error: updateError } = await supabase
      .from('site_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating site settings asset URL:', updateError);
      return { success: false, error: updateError.message };
    }

    revalidateTag('cms-settings', 'max');
    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    console.error('Exception uploading site asset:', err);
    return { success: false, error: getErrorMessage(err) };
  }
}
