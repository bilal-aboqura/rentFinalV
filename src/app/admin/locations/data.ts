import { createClient } from '@/lib/supabase/server';
import { Location } from '@/types';

export interface FetchLocationsInput {
  page: number;
  limit: number;
  query?: string;
}

export interface FetchLocationsResult {
  success: boolean;
  data?: Location[];
  totalCount?: number;
  error?: string;
}

// Escape LIKE/ilike wildcard characters so user input is matched literally.
// PostgreSQL ilike treats %, _, and \ as special; backslash is the default escape.
function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '');
}

export async function fetchLocations(
  input: FetchLocationsInput
): Promise<FetchLocationsResult> {
  const { page, limit, query } = input;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from('locations')
      .select('id, name, type, is_active, created_at', { count: 'exact' });

    const trimmedQuery = query ? query.trim() : '';
    if (trimmedQuery) {
      dbQuery = dbQuery.ilike('name', `%${sanitizeSearchQuery(trimmedQuery)}%`);
    }

    const { data, error, count } = await dbQuery
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      return {
        success: false,
        error: `Failed to fetch locations: ${error.message}`,
      };
    }

    const formattedData: Location[] = (data || []).map(
      (row: { id: string; name: string; type: Location['type']; is_active: boolean; created_at: string }) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isActive: row.is_active,
        createdAt: row.created_at,
      })
    );

    return {
      success: true,
      data: formattedData,
      totalCount: count || 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      success: false,
      error: message,
    };
  }
}
