import React from 'react';
import { getPendingBookingsCount } from '@/app/admin/bookings/actions';

interface AdminNavbarProps {
  activeTab: 'locations' | 'pricing' | 'drivers' | 'bookings';
}

export default async function AdminNavbar({ activeTab }: AdminNavbarProps) {
  const countRes = await getPendingBookingsCount();
  const pendingCount = countRes.success && countRes.data ? countRes.data.count : 0;

  const getLinkClass = (tab: typeof activeTab) => {
    return activeTab === tab
      ? 'text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg transition-all duration-200'
      : 'text-slate-400 hover:text-white transition-colors duration-200';
  };

  return (
    <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
            RF
          </div>
          <span className="font-bold text-white tracking-wide">RentFinal Admin</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="/admin/locations" className={getLinkClass('locations')}>
            Locations
          </a>
          <a href="/admin/pricing" className={getLinkClass('pricing')}>
            Pricing Management
          </a>
          <a href="/admin/drivers" className={getLinkClass('drivers')}>
            Drivers Management
          </a>
          <a href="/admin/bookings" className={`${getLinkClass('bookings')} flex items-center gap-1.5`}>
            <span>Bookings</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold leading-none text-white bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/30">
                {pendingCount}
              </span>
            )}
          </a>
        </nav>
      </div>
    </header>
  );
}
