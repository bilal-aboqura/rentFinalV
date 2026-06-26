'use server';

import { createClient } from '@/lib/supabase/server';
import {
  CreateDriverInput,
  Driver,
  ServerActionResponse,
  UpdateDriverInput,
} from '@/types';
import { CreateDriverSchema, UpdateDriverSchema } from '@/lib/validation/driver';

interface FetchDriversInput {
  page: number;
  limit: number;
  search?: string;
}

type DriverStatus = Driver['availability_status'];

interface DriverRow {
  id: string;
  name: string;
  phone: string;
  availability_status: DriverStatus;
  created_at: string;
}

type DriverUpdateRow = Partial<{
  name: string;
  phone: string;
  availability_status: DriverStatus;
}>;

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'An unexpected error occurred';

const validationErrorsFromIssues = (issues: { path: PropertyKey[]; message: string }[]) => {
  const validationErrors: Record<string, string[]> = {};
  issues.forEach(issue => {
    const path = String(issue.path[0] ?? 'form');
    validationErrors[path] ??= [];
    validationErrors[path].push(issue.message);
  });
  return validationErrors;
};

export async function fetchDriversAction(input: FetchDriversInput) {
  const { page, limit, search } = input;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const supabase = await createClient();
    let query = supabase
      .from('drivers')
      .select('*', { count: 'exact' });

    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      query = query.or(`name.ilike.%${trimmedSearch}%,phone.ilike.%${trimmedSearch}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      return { success: false, error: `Failed to fetch drivers: ${error.message}` };
    }

    const formattedData: Driver[] = ((data || []) as DriverRow[]).map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      availability_status: row.availability_status,
      created_at: row.created_at,
    }));

    return {
      success: true,
      data: formattedData,
      totalCount: count || 0,
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function createDriverAction(
  input: CreateDriverInput
): Promise<ServerActionResponse<Driver>> {
  const validation = CreateDriverSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, validationErrors: validationErrorsFromIssues(validation.error.issues) };
  }

  const { name, phone, availability_status } = validation.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        name,
        phone,
        availability_status,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A driver with this phone number is already registered.' };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        availability_status: data.availability_status,
        created_at: data.created_at,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function updateDriverAction(
  input: UpdateDriverInput
): Promise<ServerActionResponse<Driver>> {
  const validation = UpdateDriverSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, validationErrors: validationErrorsFromIssues(validation.error.issues) };
  }

  const { id, name, phone, availability_status } = validation.data;

  try {
    const supabase = await createClient();
    const updateData: DriverUpdateRow = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (availability_status !== undefined) updateData.availability_status = availability_status;

    const { data, error } = await supabase
      .from('drivers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A driver with this phone number is already registered.' };
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Driver not found.' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        availability_status: data.availability_status,
        created_at: data.created_at,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}

export async function deleteDriverAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { id },
    };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) };
  }
}
