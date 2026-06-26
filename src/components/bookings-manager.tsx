'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BookingWithDetails } from '@/types';
import BookingDetailsModal from './booking-details-modal';
import { ChevronLeft, ChevronRight, Eye, Copy, Check, Filter } from 'lucide-react';

interface BookingsManagerProps {
  initialBookings: BookingWithDetails[];
  totalCount: number;
  currentPage: number;
  limit: number;
  initialStatusFilter: string;
}

export default function BookingsManager({
  initialBookings,
  totalCount,
  currentPage,
  limit,
  initialStatusFilter,
}: BookingsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [prevInitialBookings, setPrevInitialBookings] = useState(initialBookings);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  if (initialBookings !== prevInitialBookings) {
    setPrevInitialBookings(initialBookings);
    setBookings(initialBookings);
  }


  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status !== 'All') {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRefId(ref);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  const handleUpdateBooking = (updatedBooking: BookingWithDetails) => {
    // Update local state list
    setBookings(prev => prev.map(b => (b.id === updatedBooking.id ? updatedBooking : b)));
    // If the currently viewed booking is the updated one, update its modal state
    if (selectedBooking && selectedBooking.id === updatedBooking.id) {
      setSelectedBooking(updatedBooking);
    }
    router.refresh();
  };

  const getStatusBadgeClass = (status: BookingWithDetails['status']) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Confirmed':
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Completed':
        return 'bg-green-500/10 border border-green-500/20 text-green-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Cancelled':
        return 'bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      default:
        return 'bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
    }
  };

  const statuses = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold uppercase tracking-wider text-xs">Filter by Status</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                initialStatusFilter === status || (status === 'All' && !initialStatusFilter)
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Driver</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                    No bookings found. Adjust filter settings or wait for incoming rides.
                  </td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span>{booking.booking_reference.slice(0, 8)}...</span>
                        <button
                          onClick={() => handleCopyReference(booking.booking_reference)}
                          className="text-slate-500 hover:text-white p-1 hover:bg-slate-850 rounded transition-all cursor-pointer"
                          title="Copy Full Reference"
                        >
                          {copiedRefId === booking.booking_reference ? (
                            <Check className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{booking.customer_name}</td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <span className="text-white font-medium">{booking.pickup.name}</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="text-slate-300">{booking.destination.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{booking.booking_date}</span>
                      <span className="text-slate-500 block text-xs mt-0.5">{booking.booking_time.slice(0, 5)}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">${booking.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className={getStatusBadgeClass(booking.status)}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          booking.status === 'Pending' ? 'bg-yellow-400' :
                          booking.status === 'Confirmed' ? 'bg-blue-400' :
                          booking.status === 'Completed' ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span>{booking.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {booking.driver ? (
                        <span className="text-slate-300">{booking.driver.name}</span>
                      ) : (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        title="View Details & Manage"
                        className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 font-medium text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">
              Showing Page {currentPage} of {totalPages} ({totalCount} total bookings)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdate={handleUpdateBooking}
        />
      )}
    </div>
  );
}
