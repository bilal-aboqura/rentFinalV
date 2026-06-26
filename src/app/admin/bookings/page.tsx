import React from 'react';
import { fetchBookingsAction } from './actions';
import BookingsManager from '@/components/bookings-manager';
import { BookingWithDetails } from '@/types';
import AdminNavbar from '@/components/admin-navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageParam = params.page;
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1;
  const statusParam = params.status;
  const statusFilter = typeof statusParam === 'string' ? statusParam : undefined;
  const limit = 10;

  let validStatus: BookingWithDetails['status'] | undefined = undefined;
  if (statusFilter && ['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(statusFilter)) {
    validStatus = statusFilter as BookingWithDetails['status'];
  }

  const bookingsRes = await fetchBookingsAction({ page, limit, statusFilter: validStatus });

  const bookings = bookingsRes.success && bookingsRes.data ? bookingsRes.data.bookings : [];
  const totalCount = bookingsRes.success && bookingsRes.data ? bookingsRes.data.totalCount : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <AdminNavbar activeTab="bookings" />

      {/* Admin Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Bookings & Dispatch Center
            </h1>
            <p className="text-slate-400 text-base mt-2">
              View, dispatch, and track customer bookings and driver assignments.
            </p>
          </div>

          <BookingsManager
            initialBookings={bookings}
            totalCount={totalCount}
            currentPage={page}
            limit={limit}
            initialStatusFilter={validStatus || 'All'}
          />
        </div>
      </div>
    </main>
  );
}
