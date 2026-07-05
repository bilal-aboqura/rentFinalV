'use server';

import { createClient } from '@/lib/supabase/server';
import type { Location } from '@/types';

/**
 * Public: list active locations (airports + cities) for the booking form.
 * Safe under RLS (public SELECT on locations).
 */
export async function getPublicLocationsAction(): Promise<Location[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, name_ar, type, status, created_at, updated_at')
      .eq('status', 'active')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) return [];
    return (data ?? []) as Location[];
  } catch {
    return [];
  }
}
