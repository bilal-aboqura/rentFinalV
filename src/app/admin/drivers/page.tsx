import React from 'react';
import { fetchDriversAction } from './actions';
import DriversManager from '@/components/drivers-manager';
import AdminNavbar from '@/components/admin-navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminDriversPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageParam = params.page;
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1;
  const searchParam = params.search;
  const search = typeof searchParam === 'string' ? searchParam : undefined;
  const limit = 10;

  const driversRes = await fetchDriversAction({ page, limit, search });

  const drivers = driversRes.success && driversRes.data ? driversRes.data : [];
  const totalCount = driversRes.success && driversRes.totalCount ? driversRes.totalCount : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <AdminNavbar activeTab="drivers" />

      {/* Admin Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Fleet & Drivers Configuration
            </h1>
            <p className="text-slate-400 text-base mt-2">
              Manage the fleet of drivers, register contact details, and update availability status.
            </p>
          </div>

          <DriversManager
            initialDrivers={drivers}
            totalCount={totalCount}
            currentPage={page}
            limit={limit}
            initialSearch={search || ''}
          />
        </div>
      </div>
    </main>
  );
}
