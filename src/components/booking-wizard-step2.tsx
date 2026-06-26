'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookingStep2Schema } from '@/lib/validation/booking';
import { 
  CheckCircle2, User, Mail, Phone, Calendar, Clock, MapPin, 
  Navigation, ArrowLeft, Check, Loader2, AlertCircle, HelpCircle, FileText 
} from 'lucide-react';

interface BookingWizardStep2Props {
  pickupLocationName: string;
  destinationLocationName: string;
  date: string;
  time: string;
  price: number;
  onBack: () => void;
  initialBookingReference?: string | null;
  onSubmit: (data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    flightNumber?: string;
    notes?: string;
  }) => Promise<{ success: boolean; bookingReference?: string; error?: string; validationErrors?: Record<string, string[]> }>;
}

interface BookingDetails {
  id: string;
  booking_reference: string;
  booking_date: string;
  booking_time: string;
  price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  flight_number: string | null;
  notes: string | null;
  status: string;
  pickup?: { name: string } | null;
  destination?: { name: string } | null;
}

interface BookingDetailsRow extends Omit<BookingDetails, 'pickup' | 'destination'> {
  pickup?: { name: string } | { name: string }[] | null;
  destination?: { name: string } | { name: string }[] | null;
}

export default function BookingWizardStep2({
  pickupLocationName,
  destinationLocationName,
  date,
  time,
  price,
  onBack,
  initialBookingReference = null,
  onSubmit
}: BookingWizardStep2Props) {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Booking confirmation reference from server
  const [bookingReference, setBookingReference] = useState<string | null>(initialBookingReference);

  // Success view fetch states
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Fetch booking details on success to verify RLS and show verified DB state
  useEffect(() => {
    if (bookingReference) {
      const currentBookingReference = bookingReference;
      async function fetchBooking() {
        setLoadingDetails(true);
        try {
          const supabase = createClient({
            global: {
              headers: {
                'x-booking-reference': currentBookingReference
              }
            }
          });
          const { data, error } = await supabase
            .from('bookings')
            .select(`
              id,
              booking_reference,
              booking_date,
              booking_time,
              price,
              customer_name,
              customer_email,
              customer_phone,
              flight_number,
              notes,
              status,
              pickup:locations!pickup_location_id(name),
              destination:locations!destination_location_id(name)
            `)
            .eq('booking_reference', currentBookingReference)
            .single();

          if (error) {
            setFetchError(error.message);
          } else {
            const rawData = data as BookingDetailsRow;
            const mappedData: BookingDetails = {
              id: rawData.id,
              booking_reference: rawData.booking_reference,
              booking_date: rawData.booking_date,
              booking_time: rawData.booking_time,
              price: Number(rawData.price),
              customer_name: rawData.customer_name,
              customer_email: rawData.customer_email,
              customer_phone: rawData.customer_phone,
              flight_number: rawData.flight_number,
              notes: rawData.notes,
              status: rawData.status,
              pickup: Array.isArray(rawData.pickup)
                ? (rawData.pickup[0] as { name: string })
                : rawData.pickup,
              destination: Array.isArray(rawData.destination)
                ? (rawData.destination[0] as { name: string })
                : rawData.destination,
            };
            setBookingDetails(mappedData);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to retrieve booking confirmation.';
          setFetchError(message);
        } finally {
          setLoadingDetails(false);
        }
      }
      fetchBooking();
    }
  }, [bookingReference]);

  // Form submit handler with Zod validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setValidationErrors({});
    setIsSubmitting(true);

    const formData = {
      customerName,
      customerEmail,
      customerPhone,
      flightNumber: flightNumber || undefined,
      notes: notes || undefined
    };

    // Client-side schema validation
    const parsed = BookingStep2Schema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await onSubmit(formData);
      if (res.success && res.bookingReference) {
        setBookingReference(res.bookingReference);
      } else {
        if (res.validationErrors) {
          const flatErrors: Record<string, string> = {};
          Object.entries(res.validationErrors).forEach(([key, val]) => {
            flatErrors[key] = val[0] || 'Invalid value.';
          });
          setValidationErrors(flatErrors);
        } else {
          setSubmitError(res.error || 'Failed to submit booking. Please try again.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (bookingReference) {
    return (
      <div className="w-full max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="inline-flex p-3.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-1 shadow-inner">
          <CheckCircle2 className="w-9 h-9 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Booking Requested!</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Your reservation request has been received. Below is your booking details verified from the database. A confirmation email has been sent to your inbox.
        </p>

        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
            <span className="text-slate-400 text-xs font-semibold tracking-wider uppercase">Loading database confirmation...</span>
          </div>
        ) : fetchError ? (
          <div className="p-5 bg-red-950/40 border border-red-900/50 text-red-200 rounded-2xl text-xs flex gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="space-y-1">
              <span className="font-bold text-red-100 block">Security policy check:</span>
              <p className="leading-relaxed">
                Could not fetch verified details directly. Security Row Level Security is active. Reference ID: <code className="bg-red-950 px-1 py-0.5 rounded text-white font-mono">{bookingReference}</code>. Error: {fetchError}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3.5 divide-y divide-slate-850 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center text-slate-400 pt-0">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-400">Route & Fare</span>
              <span className="font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full select-all">
                REF: {bookingDetails?.booking_reference}
              </span>
            </div>
            
            <div className="space-y-2.5 pt-3.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Pickup Location</span>
                  <span className="text-slate-200 font-semibold">{bookingDetails?.pickup?.name || pickupLocationName}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Destination Location</span>
                  <span className="text-slate-200 font-semibold">{bookingDetails?.destination?.name || destinationLocationName}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Date</span>
                  <span className="text-slate-200 font-medium">{bookingDetails?.booking_date || date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-bold uppercase">Time</span>
                  <span className="text-slate-200 font-medium">{bookingDetails?.booking_time?.slice(0, 5) || time}</span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 space-y-2">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">Passenger Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{bookingDetails?.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{bookingDetails?.customer_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{bookingDetails?.customer_phone}</span>
                </div>
                {bookingDetails?.flight_number && (
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Flight: {bookingDetails?.flight_number}</span>
                  </div>
                )}
              </div>
              {bookingDetails?.notes && (
                <div className="pt-2 text-slate-400 flex gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed">{bookingDetails?.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3.5 flex justify-between items-center">
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-bold">Fare Price</span>
                <span className="text-slate-400">Status: <span className="text-amber-400 font-bold">{bookingDetails?.status}</span></span>
              </div>
              <span className="text-emerald-400 font-black text-xl">${Number(bookingDetails?.price).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3.5 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-slate-850"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  // FORM INPUT VIEW
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-xs flex gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Passenger Input Fields */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-500" />
            Full Name <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="John Doe"
            className={`w-full bg-slate-950 border text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner ${
              validationErrors.customerName ? 'border-red-500/80 focus:ring-red-600' : 'border-slate-850 hover:border-slate-800'
            }`}
          />
          {validationErrors.customerName && (
            <span className="text-red-400 text-2xs font-semibold mt-1 block">{validationErrors.customerName}</span>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            Email Address <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="email"
            required
            disabled={isSubmitting}
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            placeholder="john@example.com"
            className={`w-full bg-slate-950 border text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner ${
              validationErrors.customerEmail ? 'border-red-500/80 focus:ring-red-600' : 'border-slate-850 hover:border-slate-800'
            }`}
          />
          {validationErrors.customerEmail && (
            <span className="text-red-400 text-2xs font-semibold mt-1 block">{validationErrors.customerEmail}</span>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-500" />
            Phone Number <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="tel"
            required
            disabled={isSubmitting}
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            placeholder="+15551234567"
            className={`w-full bg-slate-950 border text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner ${
              validationErrors.customerPhone ? 'border-red-500/80 focus:ring-red-600' : 'border-slate-850 hover:border-slate-800'
            }`}
          />
          <span className="text-slate-500 text-[10px] mt-1 block">Must include country code (e.g. +1 for US, +44 for UK).</span>
          {validationErrors.customerPhone && (
            <span className="text-red-400 text-2xs font-semibold mt-1 block">{validationErrors.customerPhone}</span>
          )}
        </div>

        {/* Flight Number (Optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            Flight Number <span className="text-slate-500 text-[10px] lowercase italic">(Optional)</span>
          </label>
          <input
            type="text"
            disabled={isSubmitting}
            value={flightNumber}
            onChange={e => setFlightNumber(e.target.value)}
            placeholder="e.g. AA125"
            className={`w-full bg-slate-950 border text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner ${
              validationErrors.flightNumber ? 'border-red-500/80 focus:ring-red-600' : 'border-slate-850 hover:border-slate-800'
            }`}
          />
          {validationErrors.flightNumber && (
            <span className="text-red-400 text-2xs font-semibold mt-1 block">{validationErrors.flightNumber}</span>
          )}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Special Notes / Requests <span className="text-slate-500 text-[10px] lowercase italic">(Optional)</span>
          </label>
          <textarea
            disabled={isSubmitting}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special instructions or luggage information..."
            rows={3}
            className={`w-full bg-slate-950 border text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner resize-none ${
              validationErrors.notes ? 'border-red-500/80 focus:ring-red-600' : 'border-slate-850 hover:border-slate-800'
            }`}
          />
          {validationErrors.notes && (
            <span className="text-red-400 text-2xs font-semibold mt-1 block">{validationErrors.notes}</span>
          )}
        </div>
      </div>

      {/* Pricing Summary Card */}
      <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl flex items-center justify-between text-xs transition-colors hover:border-slate-800">
        <div className="space-y-0.5">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Route Quote</span>
          <div className="text-slate-300 font-semibold truncate max-w-[280px]">
            {pickupLocationName} to {destinationLocationName}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Fare Price</span>
          <div className="text-white font-black text-xl">${price.toFixed(2)}</div>
        </div>
      </div>

      {/* Navigation & Submit buttons */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white rounded-xl px-5 py-4 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl py-4 font-bold shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs uppercase tracking-wider"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming Reservation...</span>
            </>
          ) : (
            <>
              <span>Confirm Booking Request</span>
              <Check className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
