'use server';

import { createClient } from '@/lib/supabase/server';
import { Location, ServerActionResponse } from '@/types';
import {
  CreateLocationSchema,
  LocationIdSchema,
  UpdateLocationSchema,
} from '@/lib/validation/location';

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
const LOCATION_IN_USE_ERROR =
  'Cannot delete this location because it is currently referenced by booking records or pricing rules. Consider deactivating it instead.';

function formatValidationErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const validationErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const path = String(issue.path[0] ?? '_');
    if (!validationErrors[path]) validationErrors[path] = [];
    validationErrors[path].push(issue.message);
  }
  return validationErrors;
}

export async function createLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  const validation = CreateLocationSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, validationErrors: formatValidationErrors(validation.error.issues) };
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


export async function updateLocationAction(
  input: unknown
): Promise<ServerActionResponse<Location>> {
  const validation = UpdateLocationSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, validationErrors: formatValidationErrors(validation.error.issues) };
  }

  const { id, name, type, isActive } = validation.data;
  const updateData: {
    name?: string;
    type?: Location['type'];
    is_active?: boolean;
  } = {};

  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (isActive !== undefined) updateData.is_active = isActive;

  try {
    const supabase = await createClient();
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

    if (!data) {
      return { success: false, error: 'Location not found.' };
    }
    return { success: true, data: mapLocationRow(data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}


export async function deleteLocationAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>> {
  const validation = LocationIdSchema.safeParse(id);
  if (!validation.success) {
    return {
      success: false,
      validationErrors: { id: validation.error.issues.map(issue => issue.message) },
    };
  }

  try {
    const supabase = await createClient();
    const referenceFilter = `pickup_location_id.eq.${id},destination_location_id.eq.${id}`;

    const { count: bookingReferenceCount, error: bookingReferenceError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .or(referenceFilter);

    if (bookingReferenceError) {
      return { success: false, error: bookingReferenceError.message };
    }

    if ((bookingReferenceCount || 0) > 0) {
      return { success: false, error: LOCATION_IN_USE_ERROR };
    }

    const { count: routePriceReferenceCount, error: routePriceReferenceError } = await supabase
      .from('route_prices')
      .select('id', { count: 'exact', head: true })
      .or(referenceFilter);

    if (routePriceReferenceError) {
      return { success: false, error: routePriceReferenceError.message };
    }

    if ((routePriceReferenceCount || 0) > 0) {
      return { success: false, error: LOCATION_IN_USE_ERROR };
    }

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return { success: false, error: LOCATION_IN_USE_ERROR };
      }

      return { success: false, error: error.message };
    }

    return { success: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
