import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  createHomepagePriceCard,
  getHomepagePriceCards,
  getSiteSettings,
  updateSiteSettings,
  uploadHomepagePriceCardImage,
  uploadSiteAsset,
} from '@/app/actions/cms';

type QueryResult = { data: unknown; error: { message: string } | null; count?: number | null };
type StorageUploadResult = {
  data: { path: string } | null;
  error: { message: string } | null;
};

interface QueryOptions {
  awaitResult?: QueryResult;
  maybeSingleResult?: QueryResult;
  singleResult?: QueryResult;
}

interface QueryLog {
  select: unknown[][];
  eq: unknown[][];
  order: unknown[][];
  upsert: unknown[][];
  insert: unknown[][];
  update: unknown[][];
  delete: unknown[][];
}

interface MockStorageOptions {
  listBucketsResult?: { data: Array<{ name: string }>; error: { message: string } | null };
  createBucketResult?: { error: { message: string } | null };
  uploadResult?: StorageUploadResult;
  publicUrl?: string;
}

function createQuery(options: QueryOptions = {}) {
  const log: QueryLog = {
    select: [],
    eq: [],
    order: [],
    upsert: [],
    insert: [],
    update: [],
    delete: [],
  };

  const awaitResult = options.awaitResult ?? { data: null, error: null };

  const query = {
    select: vi.fn((...args: unknown[]) => {
      log.select.push(args);
      return query;
    }),
    eq: vi.fn((...args: unknown[]) => {
      log.eq.push(args);
      return query;
    }),
    order: vi.fn((...args: unknown[]) => {
      log.order.push(args);
      return query;
    }),
    upsert: vi.fn((...args: unknown[]) => {
      log.upsert.push(args);
      return query;
    }),
    insert: vi.fn((...args: unknown[]) => {
      log.insert.push(args);
      return query;
    }),
    update: vi.fn((...args: unknown[]) => {
      log.update.push(args);
      return query;
    }),
    delete: vi.fn((...args: unknown[]) => {
      log.delete.push(args);
      return query;
    }),
    maybeSingle: vi.fn(async () => options.maybeSingleResult ?? { data: null, error: null }),
    single: vi.fn(async () => options.singleResult ?? { data: null, error: null }),
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(awaitResult).then(resolve),
  };

  return { query, log };
}

function createFromFactory(tableQueries: Record<string, QueryOptions[]>) {
  const logs: Record<string, QueryLog[]> = {};

  const from = vi.fn((table: string) => {
    const queue = tableQueries[table] ?? [];
    const options = queue.shift() ?? {};
    const { query, log } = createQuery(options);
    logs[table] ??= [];
    logs[table].push(log);
    return query;
  });

  return { from, logs };
}

function buildPublicClient(options?: {
  tableQueries?: Record<string, QueryOptions[]>;
  user?: { id: string; email?: string } | null;
}) {
  const { from, logs } = createFromFactory(options?.tableQueries ?? {});
  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: options?.user === undefined ? { id: 'user-1', email: 'admin@example.com' } : options.user,
        },
        error: null,
      })),
    },
    from,
  };

  return { client, logs };
}

function buildServiceClient(options?: {
  tableQueries?: Record<string, QueryOptions[]>;
  storage?: MockStorageOptions;
}) {
  const { from, logs } = createFromFactory(options?.tableQueries ?? {});
  const upload = vi.fn(async () => {
    return (
      options?.storage?.uploadResult ?? {
        data: { path: 'branding/site-logo.png' },
        error: null,
      }
    );
  });
  const getPublicUrl = vi.fn(() => ({
    data: {
      publicUrl: options?.storage?.publicUrl ?? 'https://cdn.example.com/branding/site-logo.png',
    },
  }));
  const listBuckets = vi.fn(async () => {
    return (
      options?.storage?.listBucketsResult ?? {
        data: [{ name: 'public_assets' }],
        error: null,
      }
    );
  });
  const createBucket = vi.fn(async () => options?.storage?.createBucketResult ?? { error: null });

  const client = {
    from,
    storage: {
      listBuckets,
      createBucket,
      from: vi.fn(() => ({
        upload,
        getPublicUrl,
      })),
    },
  };

  return { client, logs, upload, getPublicUrl, listBuckets, createBucket };
}

const settingsRow = {
  id: 1,
  hero_title: 'عنوان رئيسي',
  about_text: 'نبذة تعريفية',
  contact_phone: '+966500000000',
  contact_email: 'hello@example.com',
  brand_primary_color: '#50A6B9',
  brand_secondary_color: '#C3A16F',
  hero_image_url: null,
  site_logo_url: null,
  updated_at: '2026-07-03T00:00:00Z',
};

const validInput = {
  hero_title: 'خدمة نقل احترافية',
  about_text: 'نص تجريبي عن الخدمة.',
  contact_phone: '+966511111111',
  contact_email: 'contact@example.com',
  brand_primary_color: '#50A6B9',
  brand_secondary_color: '#C3A16F',
};

const priceCardsRows = [
  {
    id: '26cb808b-eed3-48dc-8f70-026ddbf8674a',
    name: 'كامري',
    price: 200,
    passenger_capacity: 4,
    image_url: 'https://cdn.example.com/pricing-cards/camry.png',
    sort_order: 0,
    created_at: '2026-07-03T00:00:00Z',
    updated_at: '2026-07-03T00:00:00Z',
  },
  {
    id: '06b1d142-86b5-4b8a-b136-bfb22d5ab04c',
    name: 'لكزس',
    price: 400,
    passenger_capacity: 6,
    image_url: null,
    sort_order: 1,
    created_at: '2026-07-03T00:00:00Z',
    updated_at: '2026-07-03T00:00:00Z',
  },
];

beforeEach(() => {
  vi.mocked(createClient).mockReset();
  vi.mocked(createServiceClient).mockReset();
  vi.mocked(revalidatePath).mockReset();
  vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getSiteSettings', () => {
  it('returns settings from the site_settings row', async () => {
    const { client, logs } = buildPublicClient({
      tableQueries: {
        site_settings: [{ maybeSingleResult: { data: settingsRow, error: null } }],
      },
    });

    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await getSiteSettings();

    expect(result.hero_title).toBe('عنوان رئيسي');
    expect(logs.site_settings[0].eq).toContainEqual(['id', 1]);
  });

  it('falls back to defaults when loading settings fails', async () => {
    const { client } = buildPublicClient({
      tableQueries: {
        site_settings: [{ maybeSingleResult: { data: null, error: { message: 'offline' } } }],
      },
    });

    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await getSiteSettings();

    expect(result.id).toBe(1);
    expect(result.hero_title).toBeTruthy();
    expect(result.brand_secondary_color).toBe('#C3A16F');
  });
});

describe('updateSiteSettings', () => {
  it('upserts validated settings and revalidates CMS paths', async () => {
    const { client, logs } = buildPublicClient({
      tableQueries: {
        site_settings: [
          { maybeSingleResult: { data: settingsRow, error: null } },
          { singleResult: { data: settingsRow, error: null } },
        ],
      },
    });

    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await updateSiteSettings(validInput);

    expect(result).toEqual({ success: true });
    expect(logs.site_settings[1].upsert[0][0]).toMatchObject({
      id: 1,
      contact_email: 'contact@example.com',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/content');
  });

  it('rejects invalid email addresses', async () => {
    const { client } = buildPublicClient();
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await updateSiteSettings({ ...validInput, contact_email: 'bad-email' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('بريد');
    }
  });
});

describe('uploadSiteAsset', () => {
  it('uploads a logo image and stores its public URL', async () => {
    const { client: publicClient } = buildPublicClient();
    const {
      client: serviceClient,
      logs,
      upload,
      getPublicUrl,
    } = buildServiceClient({
      tableQueries: {
        site_settings: [
          { maybeSingleResult: { data: settingsRow, error: null } },
          { singleResult: { data: settingsRow, error: null } },
        ],
      },
      storage: {
        publicUrl: 'https://cdn.example.com/branding/site-logo.png',
      },
    });

    vi.mocked(createClient).mockResolvedValue(publicClient as never);
    vi.mocked(createServiceClient).mockResolvedValue(serviceClient as never);

    const formData = new FormData();
    formData.set('assetType', 'logo');
    formData.set('file', new File(['image-bytes'], 'logo.png', { type: 'image/png' }));

    const result = await uploadSiteAsset(formData);

    expect(result).toEqual({
      success: true,
      url: 'https://cdn.example.com/branding/site-logo.png?v=1700000000000',
    });
    expect(upload).toHaveBeenCalled();
    expect(getPublicUrl).toHaveBeenCalledWith('branding/site-logo.png');
    expect(logs.site_settings[1].upsert[0][0]).toMatchObject({
      site_logo_url: 'https://cdn.example.com/branding/site-logo.png?v=1700000000000',
    });
  });

  it('rejects invalid file types', async () => {
    const { client: publicClient } = buildPublicClient();
    vi.mocked(createClient).mockResolvedValue(publicClient as never);

    const formData = new FormData();
    formData.set('assetType', 'hero');
    formData.set('file', new File(['pdf'], 'asset.pdf', { type: 'application/pdf' }));

    const result = await uploadSiteAsset(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('PNG');
    }
  });
});

describe('homepage price cards', () => {
  it('returns homepage price cards sorted from the CMS table', async () => {
    const { client } = buildPublicClient({
      tableQueries: {
        homepage_price_cards: [{ awaitResult: { data: priceCardsRows, error: null } }],
      },
    });

    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await getHomepagePriceCards();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('كامري');
    expect(result[1].price).toBe(400);
    expect(result[0].passenger_capacity).toBe(4);
  });

  it('creates a homepage price card with the next sort order', async () => {
    const { client: publicClient } = buildPublicClient({
      tableQueries: {
        homepage_price_cards: [{ awaitResult: { data: priceCardsRows, error: null } }],
      },
    });
    const { client: serviceClient, logs } = buildServiceClient({
      tableQueries: {
        homepage_price_cards: [
          {
            singleResult: {
              data: {
                ...priceCardsRows[0],
                id: '4f3fdd9e-8dbd-4548-94c8-6a1a0c5bc95c',
                name: 'يوكون',
                price: 450,
                passenger_capacity: 7,
                sort_order: 2,
              },
              error: null,
            },
          },
        ],
      },
    });

    vi.mocked(createClient).mockResolvedValue(publicClient as never);
    vi.mocked(createServiceClient).mockResolvedValue(serviceClient as never);

    const result = await createHomepagePriceCard({
      name: 'يوكون',
      price: 450,
      passenger_capacity: 7,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(2);
      expect(result.data.passenger_capacity).toBe(7);
    }
    expect(logs.homepage_price_cards[0].insert[0][0]).toMatchObject({
      name: 'يوكون',
      price: 450,
      passenger_capacity: 7,
      sort_order: 2,
    });
  });

  it('uploads a homepage price card image and updates the row', async () => {
    const { client: publicClient } = buildPublicClient();
    const { client: serviceClient, logs, getPublicUrl } = buildServiceClient({
      tableQueries: {
        homepage_price_cards: [
          {
            singleResult: {
              data: {
                ...priceCardsRows[0],
                image_url: 'https://cdn.example.com/pricing-cards/26cb808b-eed3-48dc-8f70-026ddbf8674a.png',
              },
              error: null,
            },
          },
        ],
      },
      storage: {
        publicUrl:
          'https://cdn.example.com/pricing-cards/26cb808b-eed3-48dc-8f70-026ddbf8674a.png',
      },
    });

    vi.mocked(createClient).mockResolvedValue(publicClient as never);
    vi.mocked(createServiceClient).mockResolvedValue(serviceClient as never);

    const formData = new FormData();
    formData.set('file', new File(['image-bytes'], 'camry.png', { type: 'image/png' }));

    const result = await uploadHomepagePriceCardImage(priceCardsRows[0].id, formData);

    expect(result.success).toBe(true);
    expect(getPublicUrl).toHaveBeenCalledWith(
      'pricing-cards/26cb808b-eed3-48dc-8f70-026ddbf8674a.png'
    );
    expect(logs.homepage_price_cards[0].update[0][0]).toMatchObject({
      image_url:
        'https://cdn.example.com/pricing-cards/26cb808b-eed3-48dc-8f70-026ddbf8674a.png?v=1700000000000',
    });
  });
});
