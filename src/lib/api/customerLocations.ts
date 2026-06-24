'use server';

import { createClient } from '@/lib/supabase/server';
import { Location } from '@/types';

interface FetchActiveLocationsResult {
  success: boolean;
  data?: Location[];
  error?: string;
}

// Customer-facing fetch: returns only ACTIVE locations, sorted alphabetically
// by name, for use in the booking wizard dropdowns. Aligned with FR-007/FR-008.
export async function fetchActiveLocationsAction(): Promise<FetchActiveLocationsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, type, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const locations: Location[] = (data || []).map(
      (row: {
        id: string;
        name: string;
        type: Location['type'];
        is_active: boolean;
        created_at: string;
      }) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        isActive: row.is_active,
        createdAt: row.created_at,
      })
    );

    return { success: true, data: locations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
