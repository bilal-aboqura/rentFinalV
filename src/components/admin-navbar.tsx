import React from 'react';
import { getPendingBookingsCount } from '@/app/admin/bookings/actions';
import { getUnreadInquiriesCount } from '@/app/admin/inquiries/actions';

interface AdminNavbarProps {
  activeTab: 'locations' | 'pricing' | 'drivers' | 'bookings' | 'inquiries';
}

export default async function AdminNavbar({ activeTab }: AdminNavbarProps) {
  // Fetch pending bookings count
  const bookingsCountRes = await getPendingBookingsCount();
  const pendingCount = bookingsCountRes.success && bookingsCountRes.data ? bookingsCountRes.data.count : 0;

  // Fetch unread inquiries count
  const inquiriesCountRes = await getUnreadInquiriesCount();
  const unreadInquiriesCount = inquiriesCountRes.success && inquiriesCountRes.data ? inquiriesCountRes.data.count : 0;

  const getLinkClass = (tab: typeof activeTab) => {
    return activeTab === tab
      ? 'text-white bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg transition-all duration-200'
      : 'text-slate-400 hover:text-white transition-colors duration-200';
  };

  return (
    <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              RF
            </div>
            <span className="font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors">RentFinal Admin</span>
          </a>
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
          <a href="/admin/inquiries" className={`${getLinkClass('inquiries')} flex items-center gap-1.5`}>
            <span>Inquiries</span>
            {unreadInquiriesCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold leading-none text-white bg-blue-500 rounded-full shadow-sm shadow-blue-500/30">
                {unreadInquiriesCount}
              </span>
            )}
          </a>
        </nav>
      </div>
    </header>
  );
}
