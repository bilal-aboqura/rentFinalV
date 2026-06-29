/**
 * T014 [US1] - Admin Locations Page (React Server Component).
 * Renders the paginated, searchable locations management table.
 *
 * Route: /admin/locations
 */
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocationsData } from './data';
import { LocationsManager } from '@/components/locations-manager';

interface LocationsPageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export const metadata = {
  title: 'Locations Management | Admin',
  description: 'Manage cities, airports, and pickup points for the transfer booking service.',
};

export default async function AdminLocationsPage({ searchParams }: LocationsPageProps) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const params = await searchParams;
  const search = params.search ?? '';
  const page = parseInt(params.page ?? '1', 10);
  const pageSize = 10;

  const result = await getLocationsData({ search, page, pageSize });

  if (!result.success) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="text-red-400 text-sm">Failed to load locations: {result.error}</p>
      </div>
    );
  }

  const { locations, total, totalPages } = result.data;

  return (
    <Suspense fallback={<div className="text-slate-500 text-sm">Loading...</div>}>
      <LocationsManager
        initialLocations={locations}
        initialTotal={total}
        initialPage={page}
        initialPageSize={pageSize}
        initialTotalPages={totalPages}
        initialSearch={search}
      />
    </Suspense>
  );
}
