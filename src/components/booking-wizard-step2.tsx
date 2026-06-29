'use client';

/**
 * T007 / T012 — Booking Wizard Step 2: Passenger Details & Success Confirmation
 *
 * User Stories:
 *   US1 — Display order summary + passenger details form (P1 MVP)
 *   US2 — Submit booking, verify price, persist to DB, clear wizard state (P2)
 *   US3 — Success confirmation view showing booking reference (P3)
 *
 * Spec: specs/006-booking-wizard-step2/spec.md
 * Plan: specs/006-booking-wizard-step2/plan.md
 */

import { useState, useTransition } from 'react';
import {
  User,
  Mail,
  Phone,
  Plane,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { submitBookingAction } from '@/app/actions/booking';
import type { BookingStep1State } from '@/components/booking-wizard-step1';
import type { BookingStep2Input } from '@/lib/validation/booking';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface BookingWizardStep2Props {
  /** Step 1 state carrying route, date, time, and price */
  step1State: BookingStep1State;
  /** Location names fetched from parent for display */
  pickupLocationName: string;
  destinationLocationName: string;
  /** Called when the user wants to go back to Step 1 */
  onBack: () => void;
  /** Called after successful submission to reset the whole wizard */
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Order Summary Card (US1)
// ─────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  pickupLocationName: string;
  destinationLocationName: string;
  date: string;
  time: string;
  price: number;
}

function OrderSummaryCard({
  pickupLocationName,
  destinationLocationName,
  date,
  time,
  price,
}: OrderSummaryProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5 space-y-3">
      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        Trip Summary
      </h4>
      <div className="space-y-2.5 text-sm">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400">Pickup: </span>
            <span className="text-white font-medium">{pickupLocationName}</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-slate-400">Destination: </span>
            <span className="text-white font-medium">{destinationLocationName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-400">Date: </span>
          <span className="text-white font-medium">{date}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="text-slate-400">Time: </span>
          <span className="text-white font-medium">{time}</span>
        </div>
        <div className="border-t border-white/10 pt-2.5 flex items-center justify-between">
          <span className="text-slate-300 font-semibold">Total Price</span>
          <span
            className="text-xl font-bold text-emerald-400"
            id="order-summary-price"
          >
            {formattedPrice}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Success Confirmation View (US3, T012)
// ─────────────────────────────────────────────────────────────

interface SuccessViewProps {
  bookingReference: string;
  customerName: string;
  onReset: () => void;
}

function SuccessView({ bookingReference, customerName, onReset }: SuccessViewProps) {
  return (
    <div
      className="text-center space-y-6 py-4"
      id="booking-success-view"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white">Booking Request Received!</h3>
        <p className="text-slate-400">
          Thank you, <span className="text-white font-medium">{customerName}</span>. Your
          transfer request has been submitted and is pending confirmation.
        </p>
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 space-y-2">
        <p className="text-slate-400 text-sm">Your booking reference</p>
        <p
          className="text-white font-mono text-sm break-all font-semibold"
          id="booking-reference-display"
        >
          {bookingReference}
        </p>
        <p className="text-slate-500 text-xs">
          Please save this reference. You&apos;ll need it to look up your booking.
        </p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-400">
        <p>
          A confirmation email has been sent to your inbox. Our team will review your request
          and get in touch to confirm your transfer.
        </p>
      </div>

      <button
        id="book-another-btn"
        onClick={onReset}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
      >
        Book Another Transfer
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component: BookingWizardStep2
// ─────────────────────────────────────────────────────────────

export function BookingWizardStep2({
  step1State,
  pickupLocationName,
  destinationLocationName,
  onBack,
  onReset,
}: BookingWizardStep2Props) {
  // ── Form state ──
  const [form, setForm] = useState<BookingStep2Input>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    flightNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingStep2Input | 'general', string>>>({});
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<{ bookingReference: string; customerName: string } | null>(null);

  // ── Handlers ──
  const updateField = (field: keyof BookingStep2Input, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
  };

  const handleSubmit = () => {
    const newErrors: typeof errors = {};

    if (!form.customerName.trim()) newErrors.customerName = 'Full name is required.';
    if (!form.customerEmail.trim()) newErrors.customerEmail = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
      newErrors.customerEmail = 'Please enter a valid email address.';
    if (!form.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required.';
    else if (!/^\+[1-9]\d{1,14}$/.test(form.customerPhone))
      newErrors.customerPhone = 'Phone must be in E.164 format (e.g. +15551234567).';

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const payload = {
        pickupLocationId: step1State.pickupLocationId,
        destinationLocationId: step1State.destinationLocationId,
        date: step1State.date,
        time: step1State.time,
        price: step1State.price!,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        flightNumber: form.flightNumber?.trim() || null,
        notes: form.notes?.trim() || null,
      };

      const result = await submitBookingAction(payload);

      if (result.success && result.data) {
        setSuccessData({
          bookingReference: result.data.bookingReference,
          customerName: form.customerName.trim(),
        });
        return;
      }

      // Handle server validation errors
      if (result.validationErrors) {
        const fieldErrors: typeof errors = {};
        Object.entries(result.validationErrors).forEach(([key, msgs]) => {
          fieldErrors[key as keyof typeof errors] = msgs[0];
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: result.error ?? 'An unexpected error occurred. Please try again.' });
      }
    });
  };

  // ── Show success view after successful submission (US3) ──
  if (successData) {
    return (
      <SuccessView
        bookingReference={successData.bookingReference}
        customerName={successData.customerName}
        onReset={onReset}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render: Passenger Form + Order Summary
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Passenger Details</h3>
        <p className="text-sm text-slate-400">Review your trip and enter your contact information.</p>
      </div>

      {/* ── Order Summary (US1, read-only) ── */}
      <OrderSummaryCard
        pickupLocationName={pickupLocationName}
        destinationLocationName={destinationLocationName}
        date={step1State.date}
        time={step1State.time}
        price={step1State.price ?? 0}
      />

      {/* ── General error ── */}
      {errors.general && (
        <div
          className="flex items-center gap-2 text-red-300 text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20"
          role="alert"
          id="form-general-error"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {/* ── Passenger form fields ── */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="customer-name" className="block text-sm font-medium text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Full Name <span className="text-red-400">*</span>
            </span>
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Jane Doe"
            value={form.customerName}
            onChange={(e) => updateField('customerName', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm ${
              errors.customerName ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500'
            }`}
          />
          {errors.customerName && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="customer-email" className="block text-sm font-medium text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Email Address <span className="text-red-400">*</span>
            </span>
          </label>
          <input
            id="customer-email"
            type="email"
            placeholder="jane@example.com"
            value={form.customerEmail}
            onChange={(e) => updateField('customerEmail', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm ${
              errors.customerEmail ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500'
            }`}
          />
          {errors.customerEmail && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {errors.customerEmail}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="customer-phone" className="block text-sm font-medium text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              Phone Number <span className="text-red-400">*</span>
            </span>
          </label>
          <input
            id="customer-phone"
            type="tel"
            placeholder="+15551234567"
            value={form.customerPhone}
            onChange={(e) => updateField('customerPhone', e.target.value)}
            className={`w-full px-4 py-3 rounded-xl bg-slate-800/80 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm ${
              errors.customerPhone ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500'
            }`}
          />
          <p className="text-slate-500 text-xs mt-1">
            International format required, e.g. +15551234567
          </p>
          {errors.customerPhone && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1" role="alert" id="phone-error">
              <AlertCircle className="w-3 h-3" />
              {errors.customerPhone}
            </p>
          )}
        </div>

        {/* Flight Number (optional) */}
        <div>
          <label htmlFor="flight-number" className="block text-sm font-medium text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-indigo-400" />
              Flight Number{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </span>
          </label>
          <input
            id="flight-number"
            type="text"
            placeholder="AB123"
            maxLength={20}
            value={form.flightNumber ?? ''}
            onChange={(e) => updateField('flightNumber', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        {/* Notes (optional) */}
        <div>
          <label htmlFor="booking-notes" className="block text-sm font-medium text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Special Requests{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </span>
          </label>
          <textarea
            id="booking-notes"
            rows={3}
            maxLength={1000}
            placeholder="e.g. Child seat required, wheelchair access needed..."
            value={form.notes ?? ''}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
          />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-3">
        <button
          id="step2-back-btn"
          onClick={onBack}
          disabled={isPending}
          className="flex-none px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          id="submit-booking-btn"
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Confirm Booking Request
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">
        No payment is required at this stage. Our team will contact you to confirm your transfer.
      </p>
    </div>
  );
}
