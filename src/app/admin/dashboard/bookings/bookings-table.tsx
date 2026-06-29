'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Booking, Driver, BookingStatus } from '@/types';
import {
  updateBookingStatusAction,
  assignDriverAction,
} from '@/app/admin/dashboard/actions';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

interface Props {
  bookings: Booking[];
  drivers: Driver[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentStatus: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function BookingsTable({
  bookings,
  drivers,
  total,
  page,
  totalPages,
  currentSearch,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const applyFilters = (params: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (params.search ?? search) sp.set('search', params.search ?? search);
    if (params.status ?? currentStatus) sp.set('status', params.status ?? currentStatus);
    if (params.page) sp.set('page', params.page);
    router.push(`/admin/dashboard/bookings?${sp.toString()}`);
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setError('');
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, newStatus);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  const handleDriverAssign = (bookingId: string, driverId: string | null) => {
    setError('');
    startTransition(async () => {
      const result = await assignDriverAction(bookingId, driverId);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="bookings-search-input"
            type="text"
            placeholder="Search reference, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ page: '1' })}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <select
          id="bookings-status-filter"
          value={currentStatus}
          onChange={(e) => applyFilters({ status: e.target.value, page: '1' })}
          className="bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          id="bookings-search-btn"
          onClick={() => applyFilters({ page: '1' })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="text-sm text-slate-500">
        Showing <span className="text-white font-medium">{bookings.length}</span> of{' '}
        <span className="text-white font-medium">{total}</span> bookings
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-left text-slate-400">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <>
                    <tr
                      key={booking.id}
                      className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    >
                      <td className="px-5 py-4 font-mono text-indigo-300 font-medium">
                        {booking.reference_id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{booking.customer_name}</p>
                        <p className="text-slate-500 text-xs">{booking.customer_email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <p className="text-xs">
                          {(booking.pickup_location as any)?.name ?? '—'} →{' '}
                          {(booking.destination_location as any)?.name ?? '—'}
                        </p>
                        <p className="text-slate-500 capitalize text-xs">{booking.vehicle_class}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs whitespace-nowrap">
                        {new Date(booking.trip_date_time).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-5 py-4 text-emerald-400 font-semibold">
                        ${booking.total_price}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            STATUS_COLORS[booking.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          id={`status-select-${booking.id}`}
                          value={booking.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(booking.id, e.target.value as BookingStatus)
                          }
                          disabled={isPending}
                          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === booking.id && (
                      <tr key={`${booking.id}-detail`} className="bg-slate-800/30">
                        <td colSpan={7} className="px-5 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Phone</p>
                              <p className="text-slate-300">{booking.customer_phone}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Booked At</p>
                              <p className="text-slate-300">
                                {new Date(booking.created_at).toLocaleString('en-GB', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Assigned Driver</p>
                              <p className="text-slate-300">
                                {(booking.driver as any)?.name ?? 'Not assigned'}
                              </p>
                            </div>
                          </div>

                          {/* Driver assignment */}
                          <div className="flex items-center gap-3">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <select
                              id={`driver-select-${booking.id}`}
                              value={booking.driver_id ?? ''}
                              onChange={(e) =>
                                handleDriverAssign(booking.id, e.target.value || null)
                              }
                              disabled={isPending}
                              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                            >
                              <option value="">Unassigned</option>
                              {drivers
                                .filter((d) => d.status === 'active')
                                .map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} — {d.license_plate}
                                  </option>
                                ))}
                            </select>
                            <span className="text-xs text-slate-500">
                              ⚠️ 3-hour overlap check enforced
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              id="bookings-prev-page"
              onClick={() => applyFilters({ page: String(page - 1) })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="bookings-next-page"
              onClick={() => applyFilters({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
