import React from 'react';
import { fetchLocations } from './data';
import LocationsManager from '@/components/locations-manager';
import AdminNavbar from '@/components/admin-navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminLocationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageParam = params.page;
  const queryParam = params.query;
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1;
  const query = typeof queryParam === 'string' ? queryParam : '';
  const limit = 10;

  const res = await fetchLocations({ page, limit, query });

  const locations = res.success && res.data ? res.data : [];
  const totalCount = res.success && res.totalCount !== undefined ? res.totalCount : 0;
  const fetchError = res.success ? '' : res.error || 'Failed to load locations.';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <AdminNavbar activeTab="locations" />

      {/* Admin Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Cities &amp; Airports Management
            </h1>
            <p className="text-slate-400 text-base mt-2">
              Manage the cities, airports, and pickup points where the transfer service operates.
            </p>
          </div>

          <LocationsManager
            initialLocations={locations}
            totalCount={totalCount}
            currentPage={page}
            limit={limit}
            currentQuery={query}
            fetchError={fetchError}
          />
        </div>
      </div>
    </main>
  );
}
