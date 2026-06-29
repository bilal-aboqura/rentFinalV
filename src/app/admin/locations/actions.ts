'use server';

/**
 * T022 [US2] / T027 [US3] / T031 [US4]
 * Server Actions for Admin Locations Management (CRUD).
 *
 * Spec: specs/002-locations-management/contracts/actions.md
 */
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  CreateLocationSchema,
  UpdateLocationSchema,
  formatLocationZodErrors,
} from '@/lib/validation/location';
import type { LocationRow, ServerActionResponse } from '@/lib/validation/location';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ----------------------------------------------------------------
// Auth helper
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
// T022 [US2] — Create Location
// ----------------------------------------------------------------
export async function createLocationAction(
  input: unknown
): Promise<ServerActionResponse<LocationRow>> {
  await requireAdmin();

  const parsed = CreateLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatLocationZodErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: parsed.data.name,
      type: parsed.data.type,
      is_active: parsed.data.isActive,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A location with this name already exists.' };
    }
    return { success: false, error: error.message ?? 'Failed to create location.' };
  }
  if (!data) return { success: false, error: 'Failed to create location.' };

  revalidatePath('/admin/locations');
  return { success: true, data: data as LocationRow };
}

// ----------------------------------------------------------------
// T027 [US3] — Update Location
// ----------------------------------------------------------------
export async function updateLocationAction(
  input: unknown
): Promise<ServerActionResponse<LocationRow>> {
  await requireAdmin();

  const parsed = UpdateLocationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatLocationZodErrors(parsed.error),
    };
  }

  const { id, name, type, isActive } = parsed.data;
  const updatePayload: Record<string, unknown> = {};
  if (name !== undefined) updatePayload.name = name;
  if (type !== undefined) updatePayload.type = type;
  if (isActive !== undefined) updatePayload.is_active = isActive;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A location with this name already exists.' };
    }
    return { success: false, error: error.message ?? 'Failed to update location.' };
  }
  if (!data) return { success: false, error: 'Location not found.' };

  revalidatePath('/admin/locations');
  return { success: true, data: data as LocationRow };
}

// ----------------------------------------------------------------
// T031 [US4] — Delete Location (with referential integrity check)
// ----------------------------------------------------------------
export async function deleteLocationAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>> {
  await requireAdmin();

  // Validate UUID
  const parsed = z.string().uuid({ message: 'Invalid location ID.' }).safeParse(id);
  if (!parsed.success) {
    return { success: false, error: 'Invalid location ID.' };
  }

  const supabase = await createClient();

  // Check if location is referenced by any booking
  const { data: bookingRef } = await supabase
    .from('bookings')
    .select('id')
    .eq('pickup_location_id', id)
    .maybeSingle();

  if (bookingRef) {
    return {
      success: false,
      error:
        'Cannot delete this location because it is currently referenced by booking records or pricing rules. Consider deactivating it instead.',
    };
  }

  // Check if location is referenced by any pricing rule
  const { data: pricingRef } = await supabase
    .from('pricing_rules')
    .select('id')
    .eq('pickup_location_id', id)
    .maybeSingle();

  if (pricingRef) {
    return {
      success: false,
      error:
        'Cannot delete this location because it is referenced by existing pricing rules. Consider deactivating it instead.',
    };
  }

  // Proceed with deletion
  const { data, error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to delete location.' };
  }

  revalidatePath('/admin/locations');
  return { success: true, data: { id: data.id } };
}

// ----------------------------------------------------------------
// Fetch all active locations (for booking wizard)
// ----------------------------------------------------------------
export async function getActiveLocationsAction(): Promise<ServerActionResponse<LocationRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, type, is_active, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as LocationRow[] };
}
