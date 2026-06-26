import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSiteSettings, updateSiteSettings, uploadSiteAsset } from '@/app/actions/cms';

// Mocks
const mockSingleSelect = vi.fn();
const mockUpdateSingle = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'site_settings') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingleSelect,
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockUpdateSingle,
            }),
          }),
        }),
      };
    }
    return {};
  }),
  storage: {
    from: vi.fn().mockImplementation((bucket: string) => {
      if (bucket === 'public_assets') {
        return {
          upload: mockStorageUpload,
          getPublicUrl: mockStorageGetPublicUrl,
        };
      }
      return {};
    }),
  },
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: { user: { id: 'admin-id', email: 'admin@example.com' } },
      },
      error: null,
    }),
  },
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    setAll: () => {},
  }),
}));

const mockRevalidateTag = vi.fn();
vi.mock('next/cache', () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag),
}));

describe('CMS Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSiteSettings', () => {
    it('should return settings from database if found', async () => {
      const mockSettings = {
        id: 1,
        hero_title: 'Custom Title',
        about_text: 'Custom About Us',
        contact_phone: '+1 (555) 012-3456',
        contact_email: 'custom@rentfinal.com',
        brand_primary_color: '#aa0000',
        brand_secondary_color: '#00aa00',
        hero_image_url: 'http://example.com/hero.jpg',
        site_logo_url: 'http://example.com/logo.png',
        updated_at: '2026-06-26T00:00:00Z',
      };

      mockSingleSelect.mockResolvedValue({ data: mockSettings, error: null });

      const res = await getSiteSettings();
      expect(res).toEqual(mockSettings);
      expect(mockSupabase.from).toHaveBeenCalledWith('site_settings');
    });

    it('should return default settings if database is empty or returns PGRST116 (No rows)', async () => {
      mockSingleSelect.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'The query returned 0 rows' },
      });

      const res = await getSiteSettings();
      expect(res.brand_primary_color).toBe('Maroon');
      expect(res.brand_secondary_color).toBe('Royal Black');
      expect(res.hero_title).toBe('Premium Car Rentals & Airport Transfers');
    });

    it('should return default settings if select query fails', async () => {
      mockSingleSelect.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Connection timeout' },
      });

      const res = await getSiteSettings();
      expect(res.hero_title).toBe('Premium Car Rentals & Airport Transfers');
    });
  });

  describe('updateSiteSettings', () => {
    const validPayload = {
      hero_title: 'Updated Hero Title',
      about_text: 'Updated about text descriptions.',
      contact_phone: '+1 (555) 999-9999',
      contact_email: 'admin@rentfinal.com',
      brand_primary_color: '#800000',
      brand_secondary_color: '#0b0c10',
    };

    it('should return error if admin is unauthorized/not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const res = await updateSiteSettings(validPayload);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('should validate inputs and reject empty fields', async () => {
      const invalidPayload = {
        ...validPayload,
        hero_title: '',
        contact_email: 'not-an-email',
      };

      const res = await updateSiteSettings(invalidPayload);
      expect(res.success).toBe(false);
      expect(res.validationErrors).toBeDefined();
      expect(res.validationErrors?.hero_title).toBeDefined();
      expect(res.validationErrors?.contact_email).toBeDefined();
    });

    it('should update database successfully and call revalidateTag', async () => {
      mockUpdateSingle.mockResolvedValue({
        data: { id: 1, ...validPayload },
        error: null,
      });

      const res = await updateSiteSettings(validPayload);
      expect(res.success).toBe(true);
      expect(mockRevalidateTag).toHaveBeenCalledWith('cms-settings');
    });

    it('should return error if database update fails', async () => {
      mockUpdateSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' },
      });

      const res = await updateSiteSettings(validPayload);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Database constraint violation');
    });
  });

  describe('uploadSiteAsset', () => {
    it('should return error if admin is unauthorized', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const formData = new FormData();
      formData.append('assetType', 'logo');
      formData.append('file', new File(['test'], 'logo.png', { type: 'image/png' }));

      const res = await uploadSiteAsset(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Unauthorized');
    });

    it('should validate file type and size', async () => {
      const formData = new FormData();
      formData.append('assetType', 'logo');
      // Create a simulated file that is 6MB in size
      const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' });
      formData.append('file', bigFile);

      const res = await uploadSiteAsset(formData);
      expect(res.success).toBe(false);
      expect(res.error).toContain('size');
    });

    it('should successfully upload and update settings logo URL', async () => {
      mockStorageUpload.mockResolvedValue({ data: { path: 'logo.png' }, error: null });
      mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'http://supabase.com/logo.png' } });
      mockUpdateSingle.mockResolvedValue({ data: { id: 1, site_logo_url: 'http://supabase.com/logo.png' }, error: null });

      const formData = new FormData();
      formData.append('assetType', 'logo');
      formData.append('file', new File(['content'], 'logo.png', { type: 'image/png' }));

      const res = await uploadSiteAsset(formData);
      expect(res.success).toBe(true);
      expect(res.url).toBe('http://supabase.com/logo.png');
      expect(mockRevalidateTag).toHaveBeenCalledWith('cms-settings');
    });
  });
});
