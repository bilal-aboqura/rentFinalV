'use server';

import { createClient } from '@/lib/supabase/server';
import {
  CreateDriverSchema,
  UpdateDriverSchema,
  formatDriverZodErrors,
  type DriverRecord,
  type DriverActionResponse,
} from '@/lib/validation/driver';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ----------------------------------------------------------------
// Auth Helper: Require authenticated admin
// ----------------------------------------------------------------
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/admin/login');
  }

  return { supabase, user };
}

// ----------------------------------------------------------------
// Paginated fetch params
// ----------------------------------------------------------------
export interface FetchDriversParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedDriversResponse {
  data: DriverRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ----------------------------------------------------------------
// T006 / US1: Fetch paginated, searchable drivers list
// ----------------------------------------------------------------
export async function fetchDriversAction(
  params: FetchDriversParams
): Promise<DriverActionResponse<PaginatedDriversResponse>> {
  await requireAdmin();
  const supabase = await createClient();

  const { search = '', page = 1, pageSize = 10 } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('drivers')
    .select('id, name, phone, license_plate, status, created_at', { count: 'exact' })
    .order('name', { ascending: true });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,license_plate.ilike.%${search}%`
    ) as typeof query;
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return { success: false, error: error.message };
  }

  const total = count ?? 0;
  return {
    success: true,
    data: {
      data: data as DriverRecord[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ----------------------------------------------------------------
// T009 / US2: Create a new driver
// ----------------------------------------------------------------
export async function createDriverAction(
  input: unknown
): Promise<DriverActionResponse<DriverRecord>> {
  await requireAdmin();

  const parsed = CreateDriverSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: formatDriverZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      license_plate: parsed.data.licensePlate,
      status: parsed.data.status,
    })
    .select('id, name, phone, license_plate, status, created_at')
    .single();

  if (error) {
    // PostgreSQL unique constraint violation code: 23505
    if (error.code === '23505') {
      return {
        success: false,
        error: 'A driver with this phone number is already registered.',
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: data as DriverRecord };
}

// ----------------------------------------------------------------
// T013 / US3: Update an existing driver
// ----------------------------------------------------------------
export async function updateDriverAction(
  input: unknown
): Promise<DriverActionResponse<DriverRecord>> {
  await requireAdmin();

  const parsed = UpdateDriverSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      validationErrors: formatDriverZodErrors(parsed.error),
    };
  }

  const { id, ...rest } = parsed.data;
  const updatePayload: Record<string, unknown> = {};
  if (rest.name !== undefined) updatePayload.name = rest.name;
  if (rest.phone !== undefined) updatePayload.phone = rest.phone;
  if (rest.licensePlate !== undefined) updatePayload.license_plate = rest.licensePlate;
  if (rest.status !== undefined) updatePayload.status = rest.status;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('drivers')
    .update(updatePayload)
    .eq('id', id)
    .select('id, name, phone, license_plate, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'A driver with this phone number is already registered.',
      };
    }
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Driver not found.' };
    }
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: 'Driver not found.' };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: data as DriverRecord };
}

// ----------------------------------------------------------------
// T017 / US4: Delete a driver
// ----------------------------------------------------------------
export async function deleteDriverAction(
  id: string
): Promise<DriverActionResponse<{ id: string }>> {
  await requireAdmin();

  if (!id) {
    return { success: false, error: 'Driver ID is required.' };
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from('drivers')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    return {
      success: false,
      error: 'Failed to delete driver. It may have already been removed or does not exist.',
    };
  }

  if (count === 0) {
    return {
      success: false,
      error: 'Failed to delete driver. It may have already been removed or does not exist.',
    };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/admin/dashboard/drivers');
  return { success: true, data: { id } };
}
