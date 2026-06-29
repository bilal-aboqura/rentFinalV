import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BookingsManager from '@/components/bookings-manager';
import { fetchBookingsAction, fetchActiveDriversAction } from './actions';
import type { BookingStatusFilter } from '@/lib/validation/booking';
import { BOOKING_STATUS_FILTERS } from '@/lib/validation/booking';

export const metadata: Metadata = {
  title: 'Bookings — Admin',
};

const PAGE_SIZE = 10;
const VALID_FILTERS = new Set<string>(BOOKING_STATUS_FILTERS);

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  // Gate: require an authenticated admin session (mirrors dashboard layout).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }

  const params = await searchParams;
  const requestedPage = Number(params.page ?? 1);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const statusFilter: BookingStatusFilter = VALID_FILTERS.has(params.status ?? '')
    ? (params.status as BookingStatusFilter)
    : 'All';

  const [bookingsRes, driversRes] = await Promise.all([
    fetchBookingsAction({ page, limit: PAGE_SIZE, statusFilter }),
    fetchActiveDriversAction(),
  ]);

  const bookings = bookingsRes.success ? bookingsRes.data.bookings : [];
  const totalCount = bookingsRes.success ? bookingsRes.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const activeDrivers = driversRes.success ? driversRes.data : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-slate-400 text-sm mt-1">
              View, filter, and manage customer booking requests
            </p>
          </div>
          <a
            href="/admin/dashboard/bookings"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-start sm:self-auto"
          >
            ← Legacy dashboard
          </a>
        </header>

        <BookingsManager
          bookings={bookings}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          statusFilter={statusFilter}
          activeDrivers={activeDrivers}
        />
      </div>
    </div>
  );
}
