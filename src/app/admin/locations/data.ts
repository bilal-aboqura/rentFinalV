/**
 * T012 [US1] - Server-side data fetching for admin locations page.
 * Uses React Server Component-compatible Supabase client.
 */
import { createClient } from '@/lib/supabase/server';
import type { LocationRow, ServerActionResponse } from '@/lib/validation/location';

export interface LocationFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedLocations {
  locations: LocationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches locations with optional case-insensitive search and pagination.
 * Used in the Admin Locations RSC page.
 */
export async function getLocationsData(
  filters: LocationFilters = {}
): Promise<ServerActionResponse<PaginatedLocations>> {
  const { search = '', page = 1, pageSize = 10 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let query = supabase
    .from('locations')
    .select('id, name, type, status, created_at', { count: 'exact' })
    .order('name', { ascending: true });

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    return { success: false, error: error.message };
  }

  const total = count ?? 0;

  return {
    success: true,
    data: {
      locations: (data ?? []) as LocationRow[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
