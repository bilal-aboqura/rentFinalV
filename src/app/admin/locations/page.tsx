import React from 'react';
import { fetchLocations } from './data';
import LocationsManager from '@/components/locations-manager';

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
      <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
              RF
            </div>
            <span className="font-bold text-white tracking-wide">RentFinal Admin</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a
              href="/admin/locations"
              className="text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg"
            >
              Locations
            </a>
            <a
              href="/admin/pricing"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Pricing Management
            </a>
          </nav>
        </div>
      </header>

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
