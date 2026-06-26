import { vi, describe, it, expect, beforeEach } from 'vitest';
import { submitContactForm } from '@/app/actions/contact';
import {
  fetchInquiriesAction,
  updateInquiryStatusAction,
  getUnreadInquiriesCount
} from '@/app/admin/inquiries/actions';

// Mock mocks
const mockInsertSelect = vi.fn();
const mockSelectOrderRange = vi.fn();
const mockSingleUpdateSelectSingle = vi.fn();
const mockCountSelectEq = vi.fn();

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    if (table === 'contact_inquiries') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsertSelect,
          }),
        }),
        select: vi.fn().mockImplementation((queryStr, options) => {
          if (options && options.head) {
            // Count query
            return {
              eq: mockCountSelectEq,
            };
          }
          return {
            order: vi.fn().mockReturnValue({
              range: mockSelectOrderRange,
            }),
          };
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockSingleUpdateSelectSingle,
            }),
          }),
        }),
      };
    }
    return {};
  }),
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-id', email: 'admin@example.com' },
        },
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

describe('submitContactForm Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'General Question',
    message: 'Hello, I have a question about booking transfers.',
  };

  it('should return validation errors if payload is invalid', async () => {
    const invalidPayload = {
      name: '',
      email: 'not-an-email',
      subject: '',
      message: '',
    };

    const res = await submitContactForm(invalidPayload);
    expect(res.success).toBe(false);
    expect(res.validationErrors).toBeDefined();
    expect((res.validationErrors as Record<string, string[]>)?.email).toBeDefined();
  });

  it('should return success and data upon successful database insert', async () => {
    mockInsertSelect.mockResolvedValue({
      data: { id: 'inquiry-uuid', status: 'Unread', ...validPayload },
      error: null,
    });

    const res = await submitContactForm(validPayload);
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ success: true });
  });

  it('should return error if database insert fails', async () => {
    mockInsertSelect.mockResolvedValue({
      data: null,
      error: { message: 'DB Insert Error' },
    });

    const res = await submitContactForm(validPayload);
    expect(res.success).toBe(false);
    expect(res.error).toBe('DB Insert Error');
  });
});

describe('fetchInquiriesAction Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: { user: { id: 'admin-id' } },
      },
      error: null,
    });
  });

  it('should return error if user is not authenticated as admin', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const res = await fetchInquiriesAction({ page: 1, limit: 10 });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized');
  });

  it('should fetch inquiries with pagination on success', async () => {
    const mockData = [
      { id: '1', name: 'User 1', email: 'u1@example.com', subject: 'S1', message: 'M1', status: 'Unread', created_at: '2026-06-26T00:00:00Z' },
      { id: '2', name: 'User 2', email: 'u2@example.com', subject: 'S2', message: 'M2', status: 'Read', created_at: '2026-06-25T00:00:00Z' },
    ];

    mockSelectOrderRange.mockResolvedValue({
      data: mockData,
      count: 2,
      error: null,
    });

    const res = await fetchInquiriesAction({ page: 1, limit: 10 });
    expect(res.success).toBe(true);
    expect(res.data?.inquiries).toHaveLength(2);
    expect(res.data?.totalCount).toBe(2);
  });

  it('should return error if query fails', async () => {
    mockSelectOrderRange.mockResolvedValue({
      data: null,
      count: 0,
      error: { message: 'Database fetch failed' },
    });

    const res = await fetchInquiriesAction({ page: 1, limit: 10 });
    expect(res.success).toBe(false);
    expect(res.error).toBe('Database fetch failed');
  });
});

describe('updateInquiryStatusAction Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: { user: { id: 'admin-id' } },
      },
      error: null,
    });
  });

  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should return error if user is not authenticated as admin', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const res = await updateInquiryStatusAction({ inquiryId: validUuid, status: 'Read' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unauthorized');
  });

  it('should return validation errors if payload is invalid', async () => {
    const res = await updateInquiryStatusAction({ inquiryId: 'not-a-uuid', status: 'InvalidStatus' });
    expect(res.success).toBe(false);
    expect(res.validationErrors).toBeDefined();
  });

  it('should update inquiry status on success', async () => {
    const mockInquiry = {
      id: validUuid,
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Hello',
      message: 'Message',
      status: 'Read',
      created_at: '2026-06-26T00:00:00Z',
    };

    mockSingleUpdateSelectSingle.mockResolvedValue({
      data: mockInquiry,
      error: null,
    });

    const res = await updateInquiryStatusAction({ inquiryId: validUuid, status: 'Read' });
    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('Read');
  });
});

describe('getUnreadInquiriesCount Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unread count successfully', async () => {
    mockCountSelectEq.mockResolvedValue({
      count: 5,
      error: null,
    });

    const res = await getUnreadInquiriesCount();
    expect(res.success).toBe(true);
    expect(res.data?.count).toBe(5);
  });

  it('should return error if query fails', async () => {
    mockCountSelectEq.mockResolvedValue({
      count: null,
      error: { message: 'Count failure' },
    });

    const res = await getUnreadInquiriesCount();
    expect(res.success).toBe(false);
    expect(res.error).toContain('Count failure');
  });
});
