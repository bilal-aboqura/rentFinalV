import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: () => Promise<unknown>) => callback,
}));

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getSiteSettings,
  updateSiteSettings,
  uploadSiteAsset,
} from '@/app/actions/cms';

const settingsRow = {
  id: 1,
  hero_title: 'Custom Hero',
  about_text: 'Custom about text',
  contact_phone: '+1 555 1000',
  contact_email: 'hello@example.com',
  brand_primary_color: '#800000',
  brand_secondary_color: '#050505',
  hero_image_url: null,
  site_logo_url: null,
  updated_at: '2026-06-26T00:00:00Z',
};

const validInput = {
  hero_title: 'Premium Airport Transfers',
  about_text: 'Professional drivers for every airport route.',
  contact_phone: '+1 555 0199',
  contact_email: 'contact@example.com',
  brand_primary_color: '#800000',
  brand_secondary_color: 'black',
};

type QueryResult = { data: unknown; error: { message: string } | null };

interface MockClientOptions {
  maybeSingleResult?: QueryResult;
  upsertResult?: QueryResult;
  updateResult?: QueryResult;
  uploadResult?: { data: { path: string } | null; error: { message: string } | null };
  publicUrl?: string;
}

interface MockQuery {
  select: (...args: unknown[]) => MockQuery;
  eq: (...args: unknown[]) => MockQuery;
  maybeSingle: () => Promise<QueryResult>;
  upsert: (...args: unknown[]) => MockQuery;
  update: (...args: unknown[]) => MockQuery;
  single: () => Promise<QueryResult>;
}

function buildQuery(calls: Record<string, unknown[][]>, options: MockClientOptions) {
  const query = {} as MockQuery;
  Object.assign(query, {
    select: vi.fn((...args: unknown[]) => {
      (calls.select ??= []).push(args);
      return query;
    }),
    eq: vi.fn((...args: unknown[]) => {
      (calls.eq ??= []).push(args);
      return query;
    }),
    maybeSingle: vi.fn(async () => options.maybeSingleResult ?? { data: null, error: null }),
    upsert: vi.fn((...args: unknown[]) => {
      (calls.upsert ??= []).push(args);
      return query;
    }),
    update: vi.fn((...args: unknown[]) => {
      (calls.update ??= []).push(args);
      return query;
    }),
    single: vi.fn(async () => options.upsertResult ?? options.updateResult ?? { data: settingsRow, error: null }),
  });

  return query;
}

function mockSupabase(options: MockClientOptions = {}) {
  const calls: Record<string, unknown[][]> = {};
  const query = buildQuery(calls, options);
  const upload = vi.fn(async (...args: unknown[]) => {
    (calls.upload ??= []).push(args);
    return options.uploadResult ?? { data: { path: 'site-logo.png' }, error: null };
  });
  const getPublicUrl = vi.fn((...args: unknown[]) => {
    (calls.getPublicUrl ??= []).push(args);
    return { data: { publicUrl: options.publicUrl ?? 'https://cdn.example.com/site-logo.png' } };
  });

  const client = {
    from: vi.fn((table: string) => {
      (calls.from ??= []).push([table]);
      return query;
    }),
    storage: {
      from: vi.fn((bucket: string) => {
        (calls.storageFrom ??= []).push([bucket]);
        return { upload, getPublicUrl };
      }),
    },
  };

  vi.mocked(createClient).mockResolvedValue(client as never);
  return { calls };
}

beforeEach(() => {
  vi.mocked(createClient).mockReset();
  vi.mocked(revalidateTag).mockReset();
});

describe('getSiteSettings', () => {
  it('returns settings from the single site_settings row', async () => {
    const { calls } = mockSupabase({
      maybeSingleResult: { data: settingsRow, error: null },
    });

    const result = await getSiteSettings();

    expect(result.hero_title).toBe('Custom Hero');
    expect(result.brand_primary_color).toBe('#800000');
    expect(calls.from).toContainEqual(['site_settings']);
    expect(calls.eq).toContainEqual(['id', 1]);
  });

  it('falls back to defaults when the settings row cannot be loaded', async () => {
    mockSupabase({
      maybeSingleResult: { data: null, error: { message: 'offline' } },
    });

    const result = await getSiteSettings();

    expect(result.id).toBe(1);
    expect(result.hero_title).toBeTruthy();
    expect(result.brand_secondary_color).toBe('#050505');
  });
});

describe('updateSiteSettings', () => {
  it('upserts validated settings and revalidates cached CMS settings', async () => {
    const { calls } = mockSupabase({
      upsertResult: { data: settingsRow, error: null },
    });

    const result = await updateSiteSettings(validInput);

    expect(result).toEqual({ success: true });
    expect(calls.upsert).toHaveLength(1);
    expect(calls.upsert[0][0]).toMatchObject({ id: 1, contact_email: 'contact@example.com' });
    expect(revalidateTag).toHaveBeenCalledWith('cms-settings', 'max');
  });

  it('rejects invalid email addresses', async () => {
    mockSupabase();

    const result = await updateSiteSettings({ ...validInput, contact_email: 'bad-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('email');
    }
  });

  it('rejects empty required text fields', async () => {
    mockSupabase();

    const result = await updateSiteSettings({ ...validInput, hero_title: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('required');
    }
  });
});

describe('uploadSiteAsset', () => {
  it('uploads a logo image, stores its public URL, and revalidates settings', async () => {
    const { calls } = mockSupabase({
      uploadResult: { data: { path: 'branding/site-logo.png' }, error: null },
      updateResult: { data: settingsRow, error: null },
      publicUrl: 'https://cdn.example.com/branding/site-logo.png',
    });
    const formData = new FormData();
    formData.set('assetType', 'logo');
    formData.set('file', new File(['image-bytes'], 'logo.png', { type: 'image/png' }));

    const result = await uploadSiteAsset(formData);

    expect(result).toEqual({
      success: true,
      url: 'https://cdn.example.com/branding/site-logo.png',
    });
    expect(calls.storageFrom).toContainEqual(['public_assets']);
    expect(calls.update[0][0]).toMatchObject({
      site_logo_url: 'https://cdn.example.com/branding/site-logo.png',
    });
    expect(revalidateTag).toHaveBeenCalledWith('cms-settings', 'max');
  });

  it('rejects invalid file types', async () => {
    mockSupabase();
    const formData = new FormData();
    formData.set('assetType', 'hero');
    formData.set('file', new File(['pdf'], 'asset.pdf', { type: 'application/pdf' }));

    const result = await uploadSiteAsset(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('PNG, JPG, or WebP');
    }
  });

  it('rejects images larger than 5MB', async () => {
    mockSupabase();
    const formData = new FormData();
    formData.set('assetType', 'hero');
    formData.set(
      'file',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'hero.png', { type: 'image/png' })
    );

    const result = await uploadSiteAsset(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('5MB');
    }
  });
});
