import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Flag } from 'lucide-react';
import {
  fetchAdminBookings,
  updateBookingStatus,
  type AdminBooking,
} from '../services/adminBookings';
import {
  BOOKING_STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  type BookingStatus,
} from '../services/types';

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminBookings({
        page,
        limit: 10,
        status: status || undefined,
        search: search.trim() || undefined,
      });
      setBookings(res.rows);
      setCount(res.count);
      setTotalPages(res.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function applyStatus(value: BookingStatus | '') {
    setStatus(value);
    setPage(1);
  }

  async function changeStatus(booking: AdminBooking, next: BookingStatus) {
    setUpdatingId(booking.id);
    try {
      await updateBookingStatus(booking.id, next);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: next } : b)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-sm text-slate-500">{count} total booking(s)</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, reference…"
            value={search}
            onChange={(e) => applySearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => applyStatus(e.target.value as BookingStatus | '')}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Trip Date</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Loading bookings…
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                      {b.reference_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{b.customer_name}</div>
                      <div className="text-xs text-slate-500">{b.customer_email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {new Date(b.trip_date_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{b.vehicle_class}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      ${Number(b.total_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {b.Driver?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE_CLASSES[b.status]
                        }`}
                      >
                        {BOOKING_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {b.status === 'pending' && (
                          <ActionButton
                            title="Confirm"
                            disabled={updatingId === b.id}
                            onClick={() => changeStatus(b, 'confirmed')}
                            icon={<CheckCircle className="h-4 w-4" />}
                          />
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <>
                            {b.status === 'confirmed' && (
                              <ActionButton
                                title="Complete"
                                disabled={updatingId === b.id}
                                onClick={() => changeStatus(b, 'completed')}
                                icon={<Flag className="h-4 w-4" />}
                              />
                            )}
                            <ActionButton
                              title="Cancel"
                              danger
                              disabled={updatingId === b.id}
                              onClick={() => changeStatus(b, 'cancelled')}
                              icon={<XCircle className="h-4 w-4" />}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  title,
  icon,
  onClick,
  disabled,
  danger,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 transition disabled:opacity-40 ${
        danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-green-600 hover:bg-green-50'
      }`}
    >
      {icon}
    </button>
  );
}
