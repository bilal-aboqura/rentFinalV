import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      updateUser: mocks.updateUser,
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
      data: { user: { id: 'admin-1', email: 'old@example.com' } },
      error: null,
    });
  });

  it('updates the authenticated admin email with the rest of the profile', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { email: 'new@example.com' } },
      error: null,
    });

    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'new@example.com',
      password: '',
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Admin User' },
      email: 'new@example.com',
    });
    expect(result).toEqual({
      success: true,
      data: {
        fullName: 'Admin User',
        email: 'new@example.com',
        emailChangePending: false,
      },
    });
  });

  it('reports when Supabase requires email confirmation', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { email: 'old@example.com' } },
      error: null,
    });

    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'pending@example.com',
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        email: 'pending@example.com',
        emailChangePending: true,
      },
    });
  });

  it('rejects invalid email addresses before calling Supabase', async () => {
    const result = await updateAdminProfileAction({
      fullName: 'Admin User',
      email: 'not-an-email',
    });

    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('does not send an unchanged email as an auth update', async () => {
    mocks.updateUser.mockResolvedValue({
      data: { user: { email: 'old@example.com' } },
      error: null,
    });

    await updateAdminProfileAction({
      fullName: 'Updated Admin',
      email: 'OLD@example.com',
      password: 'new-password',
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'Updated Admin' },
      password: 'new-password',
    });
  });
});
