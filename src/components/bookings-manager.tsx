'use client';

/**
 * Spec 007 — BookingsManager (T006 / US1 + T011 / US2)
 *
 * Interactive dashboard manager. Pagination and status filtering are driven by
 * URL search params (the server page re-runs `fetchBookingsAction` on each
 * navigation), mirroring the existing dashboard table pattern. Row clicks open
 * the BookingDetailsModal for status/driver management.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { updateBookingStatusAction, assignDriverAction, type ActiveDriverOption } from '@/app/admin/bookings/actions';
import {
  BOOKING_STATUS_FILTERS,
  type BookingWithDetails,
  type BookingStatus,
  type BookingStatusFilter,
} from '@/lib/validation/booking';
import BookingDetailsModal from './booking-details-modal';

interface Props {
  bookings: BookingWithDetails[];
  totalCount: number;
  page: number;
  totalPages: number;
  statusFilter: BookingStatusFilter;
  activeDrivers: ActiveDriverOption[];
}

const STATUS_BADGE: Record<BookingStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatTime(time: string): string {
  return String(time).slice(0, 5);
}

export default function BookingsManager({
  bookings,
  totalCount,
  page,
  totalPages,
  statusFilter,
  activeDrivers,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<BookingWithDetails | null>(null);
  const [error, setError] = useState('');

  /** Push a new page/status combination into the URL search params. */
  const navigate = (next: { page?: number; status?: BookingStatusFilter }) => {
    const sp = new URLSearchParams();
    const nextPage = next.page ?? page;
    const nextStatus = next.status ?? statusFilter;
    if (nextPage > 1) sp.set('page', String(nextPage));
    if (nextStatus !== 'All') sp.set('status', nextStatus);
    router.push(`/admin/bookings?${sp.toString()}`);
  };

  const handleStatusChange = async (bookingId: string, status: BookingStatus): Promise<boolean> => {
    setError('');
    const result = await updateBookingStatusAction({ bookingId, status });
    if (result.success) {
      setSelected(result.data);
      router.refresh();
      return true;
    }
    setError(result.error);
    return false;
  };

  const handleAssignDriver = async (
    bookingId: string,
    driverId: string | null
  ): Promise<boolean> => {
    setError('');
    const result = await assignDriverAction({ bookingId, driverId });
    if (result.success) {
      setSelected(result.data);
      router.refresh();
      return true;
    }
    setError(result.error);
    return false;
  };

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {BOOKING_STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            id={`status-tab-${filter.toLowerCase()}`}
            type="button"
            onClick={() => navigate({ status: filter, page: 1 })}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              statusFilter === filter
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-white/60 border-slate-700 text-slate-500 hover:text-slate-900 hover:border-slate-600'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Count summary */}
      <div className="text-sm text-slate-500">
        Showing <span className="text-slate-900 font-medium">{bookings.length}</span> of{' '}
        <span className="text-slate-900 font-medium">{totalCount}</span> bookings
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Inbox className="w-6 h-6" />
            <span className="text-sm">No bookings found.</span>
          </div>
        ) : (
          <>
          <div className="mobile-card-list p-3 md:hidden">
            {bookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => setSelected(booking)}
                className="mobile-data-card text-right"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{booking.customer_name}</p>
                    <p className="mt-1 overflow-hidden text-ellipsis text-xs text-slate-500" dir="ltr">
                      {booking.customer_email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_BADGE[booking.status]
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Reference</span>
                    <span className="mobile-data-value font-mono" dir="ltr">
                      {booking.booking_reference.slice(0, 8)}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Route</span>
                    <span className="mobile-data-value">
                      {booking.pickup.name} → {booking.destination.name}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Date</span>
                    <span className="mobile-data-value" dir="ltr">
                      {booking.booking_date} · {formatTime(booking.booking_time)}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">Price</span>
                    <span className="mobile-data-value font-semibold text-emerald-500" dir="ltr">
                      ${Number(booking.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10">
                <tr className="text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => setSelected(booking)}
                    className="border-b border-black/5 hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono text-indigo-300 text-xs">
                      {booking.booking_reference.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900 font-medium">{booking.customer_name}</p>
                      <p className="text-slate-500 text-xs">{booking.customer_email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 text-xs">
                      {booking.pickup.name} → {booking.destination.name}
                    </td>
                    <td className="px-5 py-4 text-slate-700 text-xs whitespace-nowrap">
                      {booking.booking_date} · {formatTime(booking.booking_time)}
                    </td>
                    <td className="px-5 py-4 text-emerald-400 font-semibold">
                      ${Number(booking.price).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          STATUS_BADGE[booking.status]
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              id="bookings-prev-page"
              type="button"
              onClick={() => navigate({ page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-white border border-slate-700 text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="bookings-next-page"
              type="button"
              onClick={() => navigate({ page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-white border border-slate-700 text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Details modal — remounted per booking via key */}
      {selected && (
        <BookingDetailsModal
          key={selected.id}
          booking={selected}
          activeDrivers={activeDrivers}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onAssignDriver={handleAssignDriver}
        />
      )}
    </div>
  );
}
