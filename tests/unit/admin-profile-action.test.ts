import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUserById: vi.fn(),
  refreshSession: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      refreshSession: mocks.refreshSession,
    },
  })),
  createServiceClient: vi.fn(async () => ({
    auth: {
      admin: {
        updateUserById: mocks.updateUserById,
      },
    },
  })),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`Redirected to ${path}`);
  }),
}));

import { updateAdminProfileAction } from '@/app/admin/dashboard/actions';

describe('updateAdminProfileAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'admin-1',
          email: 'old@example.com',
          user_metadata: { role: 'admin' },
        },
      },
      error: null,
    });
    mocks.refreshSession.mockResolvedValue({ data: {}, error: null });
  });

  it('updates and confirms the authenticated admin email immediately', async () => {
    mocks.updateUserById.mockResolvedValue({
      data: { user: { email: 'new@example.com' } },
      error: null,
    });

    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'new@example.com',
      password: '',
    });

    expect(mocks.updateUserById).toHaveBeenCalledWith('admin-1', {
      user_metadata: { role: 'admin', full_name: 'Admin User' },
      email: 'new@example.com',
      email_confirm: true,
    });
    expect(result).toEqual({
      success: true,
      data: {
        fullName: 'Admin User',
        email: 'new@example.com',
      },
    });
    expect(mocks.refreshSession).toHaveBeenCalledOnce();
  });

  it('rejects invalid email addresses before calling Supabase', async () => {
    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'not-an-email',
    });

    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it('does not send an unchanged email as an auth update', async () => {
    mocks.updateUserById.mockResolvedValue({
      data: { user: { email: 'old@example.com' } },
      error: null,
    });

    await updateAdminProfileAction({
      fullName: 'Updated Admin',
      email: 'OLD@example.com',
      password: 'new-password',
    });

    expect(mocks.updateUserById).toHaveBeenCalledWith('admin-1', {
      user_metadata: { role: 'admin', full_name: 'Updated Admin' },
      password: 'new-password',
    });
  });

  it('returns a Supabase admin update error without refreshing the session', async () => {
    mocks.updateUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    });

    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'taken@example.com',
    });

    expect(result).toEqual({ success: false, error: 'Email already registered' });
    expect(mocks.refreshSession).not.toHaveBeenCalled();
  });
});
