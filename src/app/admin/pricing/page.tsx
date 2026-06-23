import React from 'react';
import { fetchRoutePricesAction, getActiveLocationsAction } from './actions';
import PricingManager from '@/components/pricing-manager';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPricingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageParam = params.page;
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1;
  const limit = 10;

  // Run fetches in parallel for performance
  const [pricingRes, locationsRes] = await Promise.all([
    fetchRoutePricesAction({ page, limit }),
    getActiveLocationsAction(),
  ]);

  const routePrices = pricingRes.success && pricingRes.data ? pricingRes.data : [];
  const totalCount = pricingRes.success && pricingRes.totalCount ? pricingRes.totalCount : 0;
  const activeLocations = locationsRes.success && locationsRes.data ? locationsRes.data : [];

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
            <a href="/admin/locations" className="text-slate-400 hover:text-white transition-colors">
              Locations
            </a>
            <a href="/admin/pricing" className="text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg">
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
              Settings & Configuration
            </h1>
            <p className="text-slate-400 text-base mt-2">
              Manage supported geographical locations, airport nodes, and direct flat-rate pricing rules.
            </p>
          </div>

          <PricingManager
            initialRoutePrices={routePrices}
            totalCount={totalCount}
            activeLocations={activeLocations}
            currentPage={page}
            limit={limit}
          />
        </div>
      </div>
    </main>
  );
}
