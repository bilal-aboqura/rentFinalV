import type { Metadata } from 'next';
import { getBookingsAction, getDriversAction } from '@/app/admin/dashboard/actions';
import BookingsTable from './bookings-table';

export const metadata: Metadata = {
  title: 'Bookings — Admin Dashboard',
};

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function BookingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? '';
  const status = params.status ?? 'all';
  const page = Number(params.page ?? 1);

  const [bookingsRes, driversRes] = await Promise.all([
    getBookingsAction({ search, status: status as never, page, pageSize: 10 }),
    getDriversAction(),
  ]);

  const bookingsData = bookingsRes.success
    ? bookingsRes.data
    : { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const drivers = driversRes.success ? driversRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bookings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage and track all customer booking requests</p>
      </div>
      <BookingsTable
        bookings={bookingsData.data}
        drivers={drivers}
        total={bookingsData.total}
        page={bookingsData.page}
        totalPages={bookingsData.totalPages}
        currentSearch={search}
        currentStatus={status}
      />
    </div>
  );
}
