'use client';

/**
 * Spec 007 — BookingDetailsModal (T010 / US2 + T014 / US3)
 *
 * Modal showing passenger contact details, flight info, and notes, plus
 * status transition and driver assignment controls. Both control groups are
 * disabled when the booking is in a terminal state (Completed / Cancelled).
 *
 * The parent remounts this component with `key={booking.id}` so local form
 * state initializes cleanly per booking without a reset effect.
 */

import { useState, useTransition } from 'react';
import {
  X,
  Mail,
  Phone,
  Plane,
  StickyNote,
  UserCheck,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import type { BookingWithDetails, BookingStatus } from '@/lib/validation/booking';
import type { ActiveDriverOption } from '@/app/admin/bookings/actions';
import { BOOKING_STATUSES, TERMINAL_BOOKING_STATUSES } from '@/lib/validation/booking';

interface Props {
  booking: BookingWithDetails;
  activeDrivers: ActiveDriverOption[];
  onClose: () => void;
  onStatusChange: (bookingId: string, status: BookingStatus) => Promise<boolean>;
  onAssignDriver: (bookingId: string, driverId: string | null) => Promise<boolean>;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

type FieldIcon = React.ComponentType<{ className?: string }>;

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: FieldIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function BookingDetailsModal({
  booking,
  activeDrivers,
  onClose,
  onStatusChange,
  onAssignDriver,
}: Props) {
  const isTerminal = (TERMINAL_BOOKING_STATUSES as readonly string[]).includes(booking.status);

  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [driverId, setDriverId] = useState<string>(booking.driver_id ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSaveStatus = () => {
    setError('');
    setSuccess('');
    startTransition(async () => {
      const ok = await onStatusChange(booking.id, status);
      if (!ok) setError('Failed to update booking status. It may be locked or no longer exist.');
      else setSuccess('Status updated successfully.');
    });
  };

  const handleSaveDriver = () => {
    setError('');
    setSuccess('');
    startTransition(async () => {
      const ok = await onAssignDriver(booking.id, driverId || null);
      if (!ok) setError('Failed to assign driver. It may be locked or no longer exist.');
      else setSuccess('Driver assignment saved.');
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-black/10 sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Booking Details</h2>
            <p className="mt-0.5 break-all text-xs font-mono text-slate-500">{booking.booking_reference}</p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-start">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                STATUS_COLORS[booking.status]
              }`}
            >
              {booking.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 px-4 py-5 sm:px-6">
          {/* Passenger contact */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Passenger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField icon={Mail} label="Email" value={booking.customer_email} />
              <DetailField icon={Phone} label="Phone" value={booking.customer_phone} />
              <DetailField icon={Plane} label="Flight Number" value={booking.flight_number} />
              <DetailField
                icon={UserCheck}
                label="Assigned Driver"
                value={booking.driver?.name ?? 'Not assigned'}
              />
            </div>
          </section>

          {/* Trip summary */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Trip</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField
                icon={Plane}
                label="Route"
                value={`${booking.pickup.name} → ${booking.destination.name}`}
              />
              <DetailField
                icon={StickyNote}
                label="Date & Time"
                value={`${booking.booking_date} · ${String(booking.booking_time).slice(0, 5)}`}
              />
            </div>
            <DetailField icon={StickyNote} label="Special Notes" value={booking.notes} />
          </section>

          {/* Terminal lock notice */}
          {isTerminal && (
            <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 shrink-0" />
              This booking is in a terminal state and can no longer be modified.
            </div>
          )}

          {/* Status update */}
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Update Status</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                id="modal-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookingStatus)}
                disabled={isPending || isTerminal}
                className="flex-1 bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {BOOKING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                id="modal-save-status"
                type="button"
                onClick={handleSaveStatus}
                disabled={isPending || isTerminal || status === booking.status}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Status
              </button>
            </div>
          </section>

          {/* Driver assignment */}
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Assign Driver</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                id="modal-driver-select"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                disabled={isPending || isTerminal}
                className="flex-1 bg-white/60 border border-slate-700 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Unassigned</option>
                {activeDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                id="modal-save-driver"
                type="button"
                onClick={handleSaveDriver}
                disabled={isPending || isTerminal || (driverId || null) === (booking.driver_id ?? null)}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Driver
              </button>
            </div>
          </section>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && !error && (
            <div className="text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
