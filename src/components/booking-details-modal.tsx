'use client';

import React, { useState, useEffect } from 'react';
import { BookingWithDetails } from '@/types';
import { assignDriverAction, updateBookingStatusAction, fetchActiveDriversAction } from '@/app/admin/bookings/actions';
import { X, User, Mail, Phone, Plane, FileText, Calendar, Clock, DollarSign, ShieldAlert, Lock, CheckCircle2 } from 'lucide-react';

interface BookingDetailsModalProps {
  booking: BookingWithDetails;
  onClose: () => void;
  onUpdate: (updatedBooking: BookingWithDetails) => void;
}

export default function BookingDetailsModal({ booking, onClose, onUpdate }: BookingDetailsModalProps) {
  const [activeDrivers, setActiveDrivers] = useState<{ id: string; name: string; availability_status: string }[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(booking.driver_id || '');
  const [status, setStatus] = useState<BookingWithDetails['status']>(booking.status);
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if booking status is terminal
  const isTerminal = status === 'Completed' || status === 'Cancelled';

  useEffect(() => {
    // Fetch active drivers when the modal opens
    async function loadDrivers() {
      if (isTerminal) return; // No need to load active drivers if the booking is locked
      const res = await fetchActiveDriversAction();
      if (res.success && res.data) {
        setActiveDrivers(res.data);
      }
    }
    loadDrivers();
  }, [isTerminal]);

  const handleDriverChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDriverId = e.target.value || null;
    setSelectedDriverId(e.target.value);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingDriver(true);

    const res = await assignDriverAction({
      bookingId: booking.id,
      driverId: newDriverId,
    });

    setIsSavingDriver(false);
    if (res.success && res.data) {
      setSuccessMessage('Driver assigned successfully.');
      onUpdate(res.data);
    } else {
      setErrorMessage(res.error || 'Failed to assign driver.');
      // Revert select state
      setSelectedDriverId(booking.driver_id || '');
    }
  };

  const handleStatusChange = async (newStatus: BookingWithDetails['status']) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSavingStatus(true);

    const res = await updateBookingStatusAction({
      bookingId: booking.id,
      status: newStatus,
    });

    setIsSavingStatus(false);
    if (res.success && res.data) {
      setStatus(newStatus);
      setSuccessMessage(`Booking status updated to ${newStatus}.`);
      onUpdate(res.data);
    } else {
      setErrorMessage(res.error || 'Failed to update status.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Booking Reference
              <span className="text-xs font-mono px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md select-all">
                {booking.booking_reference}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Received on {new Date(booking.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Alert Banner */}
          {isTerminal ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm">Terminal State Locked</h4>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  This booking is marked as **{status}**. The booking record is locked and cannot be modified.
                </p>
              </div>
            </div>
          ) : null}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Layout Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route Details */}
            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Route & Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-blue-600/10 flex items-center justify-center font-bold text-xs text-blue-500 mt-0.5">P</div>
                  <div>
                    <p className="text-xs text-slate-400">Pickup</p>
                    <p className="text-sm font-medium text-white">{booking.pickup.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-emerald-600/10 flex items-center justify-center font-bold text-xs text-emerald-500 mt-0.5">D</div>
                  <div>
                    <p className="text-xs text-slate-400">Destination</p>
                    <p className="text-sm font-medium text-white">{booking.destination.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-white">{booking.booking_date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-white">{booking.booking_time.slice(0, 5)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Final Price</span>
                  <span className="text-base font-extrabold text-blue-500 flex items-center">
                    <DollarSign className="w-4 h-4" />
                    {booking.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passenger Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Name</p>
                    <p className="text-sm font-medium text-white">{booking.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <a href={`mailto:${booking.customer_email}`} className="text-sm font-medium text-blue-400 hover:underline">
                      {booking.customer_email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <a href={`tel:${booking.customer_phone}`} className="text-sm font-medium text-blue-400 hover:underline">
                      {booking.customer_phone}
                    </a>
                  </div>
                </div>

                {booking.flight_number && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                    <Plane className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-400">Flight Number</p>
                      <p className="text-sm font-semibold text-white uppercase">{booking.flight_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Passenger Notes */}
          {booking.notes && (
            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passenger Notes</h3>
              </div>
              <p className="text-sm text-slate-300 italic whitespace-pre-wrap leading-relaxed">
                &quot;{booking.notes}&quot;
              </p>
            </div>
          )}

          {/* Management Panel (Driver Assignment & Status Update) */}
          <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Assignment Form */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dispatch / Driver Assignment</h3>
              <div className="relative">
                <select
                  id="driver-select"
                  value={selectedDriverId}
                  onChange={handleDriverChange}
                  disabled={isTerminal || isSavingDriver}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                >
                  <option value="">-- Unassigned --</option>
                  {booking.driver_id && !activeDrivers.find(d => d.id === booking.driver_id) && (
                    <option value={booking.driver_id}>{booking.driver?.name || 'Assigned Driver'}</option>
                  )}
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.availability_status})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                  {isSavingDriver ? (
                    <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Status Update Buttons */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operational Status Actions</h3>
              <div className="flex flex-wrap gap-2">
                {/* Pending View Buttons */}
                {status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('Confirmed')}
                      disabled={isSavingStatus}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10 cursor-pointer"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => handleStatusChange('Cancelled')}
                      disabled={isSavingStatus}
                      className="px-4 py-2.5 bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 disabled:opacity-40 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}

                {/* Confirmed View Buttons */}
                {status === 'Confirmed' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('Completed')}
                      disabled={isSavingStatus}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-green-600/10 cursor-pointer"
                    >
                      Complete Ride
                    </button>
                    <button
                      onClick={() => handleStatusChange('Cancelled')}
                      disabled={isSavingStatus}
                      className="px-4 py-2.5 bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 disabled:opacity-40 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}

                {/* Locked states display */}
                {isTerminal && (
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 py-2 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    No actions available. Booking is finalized.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 sticky bottom-0 backdrop-blur-md flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
