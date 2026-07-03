/**
 * T018 [US5] - Customer-facing locations fetch function.
 * Retrieves active locations and groups them by type for the booking wizard.
 */
import { createClient } from '@/lib/supabase/server';
import { groupLocationsByType } from '@/lib/utils/groupLocations';
import type { GroupedLocations } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';

export interface CustomerLocationsResult {
  success: true;
  data: GroupedLocations;
}

export interface CustomerLocationsError {
  success: false;
  error: string;
}

export type CustomerLocationsResponse = CustomerLocationsResult | CustomerLocationsError;

/**
 * Fetches all active locations from Supabase and returns them grouped by type.
 * Safe to call from React Server Components (no auth required — uses RLS for public read).
 */
export async function getCustomerLocations(): Promise<CustomerLocationsResponse> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('id, name, type, status, created_at')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const grouped = groupLocationsByType((data ?? []) as LocationRow[]);

  return { success: true, data: grouped };
}
