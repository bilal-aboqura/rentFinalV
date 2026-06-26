import React from 'react';
import { fetchRoutePricesAction, getActiveLocationsAction } from './actions';
import PricingManager from '@/components/pricing-manager';
import AdminNavbar from '@/components/admin-navbar';

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
      <AdminNavbar activeTab="pricing" />

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
