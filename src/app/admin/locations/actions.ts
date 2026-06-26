'use server';

import { createClient } from '@/lib/supabase/server';
import { Location, ServerActionResponse } from '@/types';
import { CreateLocationSchema } from '@/lib/validation/location';

function mapLocationRow(row: {
  id: string;
  name: string;
  type: Location['type'];
  is_active: boolean;
  created_at: string;
}): Location {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

const LOCATION_COLUMNS = 'id, name, type, is_active, created_at';

export async function createLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  const validation = CreateLocationSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const path = String(issue.path[0] ?? '_');
      if (!validationErrors[path]) validationErrors[path] = [];
      validationErrors[path].push(issue.message);
    }
    return { success: false, validationErrors };
  }

  const { name, type, isActive } = validation.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('locations')
      .insert({ name, type, is_active: isActive })
      .select(LOCATION_COLUMNS)
      .single();

    if (error) {
      // 23505: unique_violation (case-insensitive name uniqueness)
      if (error.code === '23505') {
        return { success: false, error: 'A location with this name already exists.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: mapLocationRow(data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

import { UpdateLocationSchema } from '@/lib/validation/location';

export async function updateLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  const validation = UpdateLocationSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const path = String(issue.path[0] ?? '_');
      if (!validationErrors[path]) validationErrors[path] = [];
      validationErrors[path].push(issue.message);
    }
    return { success: false, validationErrors };
  }

  const { id, name, type, isActive } = validation.data;

  try {
    const supabase = await createClient();
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .select(LOCATION_COLUMNS)
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A location with this name already exists.' };
      }
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Location not found.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: mapLocationRow(data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
