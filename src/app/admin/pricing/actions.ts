'use server';

/**
 * T008 [US1] / T011 [US2] / T015 [US3] / T019 [US4] / T022 [US5]
 * Server Actions for Admin Pricing Management (CRUD + public lookup).
 *
 * Spec: specs/003-pricing-management/contracts/actions.md
 */

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  CreateRoutePriceSchema,
  UpdateRoutePriceSchema,
  formatPricingZodErrors,
} from '@/lib/validation/pricing';
import type { RoutePriceRow, ServerActionResponse } from '@/lib/validation/pricing';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ----------------------------------------------------------------
// Helpers
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

/**
 * Normalise Supabase join rows into display-friendly flat fields.
 * The join query uses aliases: pickup_location:locations!pickup_location_id(name)
 */
function normaliseRow(row: Record<string, unknown>): RoutePriceRow {
  const pickup = row.pickup_location as { name?: string } | null;
  const destination = row.destination_location as { name?: string } | null;
  return {
    id: row.id as string,
    pickup_location_id: row.pickup_location_id as string,
    destination_location_id: row.destination_location_id as string,
    price: Number(row.price),
    created_at: row.created_at as string,
    pickup_location_name: pickup?.name,
    destination_location_name: destination?.name,
  };
}

// ----------------------------------------------------------------
// T008 [US1] — Fetch paginated route prices
// ----------------------------------------------------------------
export interface GetRoutePricesParams {
  page?: number;
  pageSize?: number;
}

export interface RoutePricesPage {
  prices: RoutePriceRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getRoutePricesAction(
  params: GetRoutePricesParams = {}
): Promise<ServerActionResponse<RoutePricesPage>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('route_prices')
    .select(
      `
      id,
      pickup_location_id,
      destination_location_id,
      price,
      created_at,
      pickup_location:locations!route_prices_pickup_location_id_fkey(name),
      destination_location:locations!route_prices_destination_location_id_fkey(name)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { success: false, error: error.message ?? 'Failed to fetch pricing rules.' };
  }

  const total = count ?? 0;
  const prices = (data ?? []).map((row) => normaliseRow(row as Record<string, unknown>));

  return {
    success: true,
    data: {
      prices,
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

// ----------------------------------------------------------------
// T011 [US2] — Create a new route price
// ----------------------------------------------------------------
export async function createRoutePriceAction(
  input: unknown
): Promise<ServerActionResponse<RoutePriceRow>> {
  await requireAdmin();

  const parsed = CreateRoutePriceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatPricingZodErrors(parsed.error),
    };
  }

  const { pickupLocationId, destinationLocationId, price } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('route_prices')
    .insert({
      pickup_location_id: pickupLocationId,
      destination_location_id: destinationLocationId,
      price,
    })
    .select(
      `
      id,
      pickup_location_id,
      destination_location_id,
      price,
      created_at,
      pickup_location:locations!route_prices_pickup_location_id_fkey(name),
      destination_location:locations!route_prices_destination_location_id_fkey(name)
    `
    )
    .single();

  if (error) {
    // Unique constraint violation
    if (error.code === '23505') {
      return { success: false, error: 'A pricing rule for this route already exists.' };
    }
    // Same-location check constraint
    if (error.code === '23514') {
      return {
        success: false,
        error: 'Validation failed.',
        validationErrors: {
          destinationLocationId: ['Pickup and destination locations must be different'],
        },
      };
    }
    return { success: false, error: error.message ?? 'Failed to create pricing rule.' };
  }

  if (!data) return { success: false, error: 'Failed to create pricing rule.' };

  revalidatePath('/admin/pricing');
  return { success: true, data: normaliseRow(data as Record<string, unknown>) };
}

// ----------------------------------------------------------------
// T015 [US3] — Update an existing route price
// ----------------------------------------------------------------
export async function updateRoutePriceAction(
  input: unknown
): Promise<ServerActionResponse<RoutePriceRow>> {
  await requireAdmin();

  const parsed = UpdateRoutePriceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed.',
      validationErrors: formatPricingZodErrors(parsed.error),
    };
  }

  const { id, pickupLocationId, destinationLocationId, price } = parsed.data;

  const updatePayload: Record<string, unknown> = {};
  if (pickupLocationId !== undefined) updatePayload.pickup_location_id = pickupLocationId;
  if (destinationLocationId !== undefined)
    updatePayload.destination_location_id = destinationLocationId;
  if (price !== undefined) updatePayload.price = price;

  if (Object.keys(updatePayload).length === 0) {
    return { success: false, error: 'No fields to update.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('route_prices')
    .update(updatePayload)
    .eq('id', id)
    .select(
      `
      id,
      pickup_location_id,
      destination_location_id,
      price,
      created_at,
      pickup_location:locations!route_prices_pickup_location_id_fkey(name),
      destination_location:locations!route_prices_destination_location_id_fkey(name)
    `
    )
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A pricing rule for this route already exists.' };
    }
    if (error.code === '23514') {
      return {
        success: false,
        error: 'Validation failed.',
        validationErrors: {
          destinationLocationId: ['Pickup and destination locations must be different'],
        },
      };
    }
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Pricing rule not found.' };
    }
    return { success: false, error: error.message ?? 'Failed to update pricing rule.' };
  }

  if (!data) return { success: false, error: 'Pricing rule not found.' };

  revalidatePath('/admin/pricing');
  return { success: true, data: normaliseRow(data as Record<string, unknown>) };
}

// ----------------------------------------------------------------
// T019 [US4] — Delete a route price
// ----------------------------------------------------------------
export async function deleteRoutePriceAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>> {
  await requireAdmin();

  const parsed = z.string().uuid({ message: 'Invalid pricing rule ID.' }).safeParse(id);
  if (!parsed.success) {
    return { success: false, error: 'Invalid pricing rule ID.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('route_prices')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error:
        error?.message ??
        'Failed to delete pricing rule. It may have already been removed or does not exist.',
    };
  }

  revalidatePath('/admin/pricing');
  return { success: true, data: { id: data.id as string } };
}

// ----------------------------------------------------------------
// T022 [US5] — Public route price lookup (booking wizard)
// ----------------------------------------------------------------
export async function getRoutePriceAction(
  pickupLocationId: string,
  destinationLocationId: string
): Promise<ServerActionResponse<{ price: number }>> {
  // Validate both UUIDs
  const pickupParsed = z.string().uuid().safeParse(pickupLocationId);
  const destParsed = z.string().uuid().safeParse(destinationLocationId);

  if (!pickupParsed.success || !destParsed.success) {
    return { success: false, error: 'Invalid location IDs.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('route_prices')
    .select('price')
    .eq('pickup_location_id', pickupLocationId)
    .eq('destination_location_id', destinationLocationId)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message ?? 'Failed to fetch route price.' };
  }

  if (!data) {
    return { success: false, error: 'No pricing available for this route.' };
  }

  return { success: true, data: { price: Number(data.price) } };
}
