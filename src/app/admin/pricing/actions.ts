'use server';

import { createClient } from '@/lib/supabase/server';
import { RoutePrice, ServerActionResponse } from '@/types';
import { CreateRoutePriceSchema, UpdateRoutePriceSchema } from '@/lib/validation/pricing';

interface FetchRoutePricesInput {
  page: number;
  limit: number;
}

export async function fetchRoutePricesAction(input: FetchRoutePricesInput) {
  const { page, limit } = input;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from('route_prices')
      .select('id, price, created_at, pickup:locations!pickup_location_id(name), destination:locations!destination_location_id(name), pickup_location_id, destination_location_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      return { success: false, error: `Failed to fetch route prices: ${error.message}` };
    }

    const formattedData: RoutePrice[] = (data || []).map((row: any) => ({
      id: row.id,
      pickupLocationId: row.pickup_location_id,
      destinationLocationId: row.destination_location_id,
      price: Number(row.price),
      createdAt: row.created_at,
      pickupLocationName: row.pickup?.name || 'Unknown Location',
      destinationLocationName: row.destination?.name || 'Unknown Location',
    }));

    return {
      success: true,
      data: formattedData,
      totalCount: count || 0,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function createRoutePriceAction(
  input: any
): Promise<ServerActionResponse<RoutePrice>> {
  const validation = CreateRoutePriceSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: { [key in keyof any]?: string[] } = {};
    validation.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path]!.push(issue.message);
    });
    return { success: false, validationErrors };
  }

  const { pickupLocationId, destinationLocationId, price } = validation.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('route_prices')
      .insert({
        pickup_location_id: pickupLocationId,
        destination_location_id: destinationLocationId,
        price,
      })
      .select('id, price, created_at, pickup_location_id, destination_location_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A pricing rule for this route already exists.' };
      }
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        pickupLocationId: data.pickup_location_id,
        destinationLocationId: data.destination_location_id,
        price: Number(data.price),
        createdAt: data.created_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function updateRoutePriceAction(
  input: any
): Promise<ServerActionResponse<RoutePrice>> {
  const validation = UpdateRoutePriceSchema.safeParse(input);
  if (!validation.success) {
    const validationErrors: { [key in keyof any]?: string[] } = {};
    validation.error.issues.forEach(issue => {
      const path = issue.path[0] as string;
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path]!.push(issue.message);
    });
    return { success: false, validationErrors };
  }

  const { id, pickupLocationId, destinationLocationId, price } = validation.data;

  try {
    const supabase = await createClient();
    const updateData: any = {};
    if (pickupLocationId !== undefined) updateData.pickup_location_id = pickupLocationId;
    if (destinationLocationId !== undefined) updateData.destination_location_id = destinationLocationId;
    if (price !== undefined) updateData.price = price;

    const { data, error } = await supabase
      .from('route_prices')
      .update(updateData)
      .eq('id', id)
      .select('id, price, created_at, pickup_location_id, destination_location_id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A pricing rule for this route already exists.' };
      }
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Pricing rule not found.' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        pickupLocationId: data.pickup_location_id,
        destinationLocationId: data.destination_location_id,
        price: Number(data.price),
        createdAt: data.created_at,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function deleteRoutePriceAction(
  id: string
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('route_prices')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { id },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function getActiveLocationsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, type, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isActive: row.is_active,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}

export async function getRoutePriceAction(pickupId: string, destinationId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('route_prices')
      .select('price')
      .eq('pickup_location_id', pickupId)
      .eq('destination_location_id', destinationId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, price: null };
    }

    return { success: true, price: Number(data.price) };
  } catch (err: any) {
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
}
