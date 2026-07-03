'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  { value: 'all', label: 'كل الحالات' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const VEHICLE_LABELS: Record<string, string> = {
  standard: 'عادية',
  executive: 'تنفيذية',
  van: 'فان',
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="bookings-search-input"
            type="text"
            placeholder="ابحث بالرقم المرجعي أو الاسم أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ page: '1' })}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          id="bookings-status-filter"
          value={currentStatus}
          onChange={(e) => applyFilters({ status: e.target.value, page: '1' })}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          id="bookings-search-btn"
          onClick={() => applyFilters({ page: '1' })}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 sm:w-auto"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          بحث
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="text-sm text-slate-500">
        عرض <span className="font-medium text-slate-900">{bookings.length}</span> من أصل{' '}
        <span className="font-medium text-slate-900">{total}</span> حجوزات
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-500">لا توجد حجوزات مطابقة.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10">
                <tr className="border-b border-black/10 text-right text-slate-500">
                  <th className="hidden px-5 py-3 font-medium md:table-cell">المرجع</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">العميل</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">المسار</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">الموعد</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">الإجمالي</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">الحالة</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td colSpan={7} className="p-0">
                      <div
                        className="cursor-pointer border-b border-black/5 transition-colors hover:bg-white/40"
                        onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                      >
                        {/* Mobile card layout */}
                        <div className="space-y-3 p-4 md:hidden">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="font-mono text-sm font-medium text-indigo-600"
                              dir="ltr"
                            >
                              {booking.reference_id}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                                STATUS_COLORS[booking.status] ??
                                'border-slate-300 bg-slate-100 text-slate-700'
                              }`}
                            >
                              {STATUS_LABELS[booking.status] ?? booking.status}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{booking.customer_name}</p>
                            <p className="text-xs text-slate-500" dir="ltr">
                              {booking.customer_email}
                            </p>
                          </div>
                          <p className="text-xs text-slate-700">
                            {(booking.pickup_location as { name?: string } | null)?.name ?? '—'} إلى{' '}
                            {
                              (booking.destination_location as { name?: string } | null)?.name ??
                              '—'
                            }
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-slate-700">
                              {new Date(booking.trip_date_time).toLocaleString('ar-EG', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            <span
                              className="font-semibold text-emerald-600"
                              dir="ltr"
                            >
                              {new Intl.NumberFormat('ar-EG', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(Number(booking.total_price))}
                            </span>
                          </div>
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-end pt-1"
                          >
                            <select
                              id={`status-select-${booking.id}`}
                              value={booking.status}
                              onChange={(e) =>
                                handleStatusChange(booking.id, e.target.value as BookingStatus)
                              }
                              disabled={isPending}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                            >
                              <option value="pending">قيد الانتظار</option>
                              <option value="confirmed">مؤكد</option>
                              <option value="completed">مكتمل</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </div>
                        </div>

                        {/* Desktop grid layout */}
                        <div className="hidden grid-cols-7 items-center md:grid">
                          <div className="px-5 py-4 font-mono font-medium text-indigo-600" dir="ltr">
                            {booking.reference_id}
                          </div>
                          <div className="px-5 py-4">
                            <p className="font-medium text-slate-900">{booking.customer_name}</p>
                            <p className="text-xs text-slate-500" dir="ltr">
                              {booking.customer_email}
                            </p>
                          </div>
                          <div className="px-5 py-4 text-slate-700">
                            <p className="text-xs">
                              {(booking.pickup_location as { name?: string } | null)?.name ?? '—'} إلى{' '}
                              {(booking.destination_location as { name?: string } | null)?.name ?? '—'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {VEHICLE_LABELS[booking.vehicle_class] ?? booking.vehicle_class}
                            </p>
                          </div>
                          <div className="whitespace-nowrap px-5 py-4 text-xs text-slate-700">
                            {new Date(booking.trip_date_time).toLocaleString('ar-EG', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                          <div className="px-5 py-4 font-semibold text-emerald-600" dir="ltr">
                            {new Intl.NumberFormat('ar-EG', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(Number(booking.total_price))}
                          </div>
                          <div className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                                STATUS_COLORS[booking.status] ?? 'border-slate-300 bg-slate-100 text-slate-700'
                              }`}
                            >
                              {STATUS_LABELS[booking.status] ?? booking.status}
                            </span>
                          </div>
                          <div className="px-5 py-4">
                            <select
                              id={`status-select-${booking.id}`}
                              value={booking.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleStatusChange(booking.id, e.target.value as BookingStatus)
                              }
                              disabled={isPending}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                            >
                              <option value="pending">قيد الانتظار</option>
                              <option value="confirmed">مؤكد</option>
                              <option value="completed">مكتمل</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </div>
                        </div>

                        {expandedId === booking.id && (
                          <div className="border-t border-black/5 bg-white/50 px-5 py-4">
                            <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                              <div>
                                <p className="mb-1 text-xs text-slate-500">الهاتف</p>
                                <p className="text-slate-700" dir="ltr">{booking.customer_phone}</p>
                              </div>
                              <div>
                                <p className="mb-1 text-xs text-slate-500">تاريخ الحجز</p>
                                <p className="text-slate-700">
                                  {new Date(booking.created_at).toLocaleString('ar-EG', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1 text-xs text-slate-500">السائق المعين</p>
                                <p className="text-slate-700">
                                  {(booking.driver as { name?: string } | null)?.name ?? 'غير معين'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                              <UserCheck className="h-4 w-4 shrink-0 text-slate-500" />
                              <select
                                id={`driver-select-${booking.id}`}
                                value={booking.driver_id ?? ''}
                                onChange={(e) => handleDriverAssign(booking.id, e.target.value || null)}
                                disabled={isPending}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50 sm:w-auto"
                              >
                                <option value="">بدون تعيين</option>
                                {drivers
                                  .filter((d) => d.status === 'active')
                                  .map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name} - {d.license_plate}
                                    </option>
                                  ))}
                              </select>
                              <span className="text-xs text-slate-500">
                                يتم التحقق من تعارض المواعيد خلال 3 ساعات
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            الصفحة {page} من {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              id="bookings-prev-page"
              onClick={() => applyFilters({ page: String(page - 1) })}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              id="bookings-next-page"
              onClick={() => applyFilters({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
