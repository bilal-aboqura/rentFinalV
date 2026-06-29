'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  MapPin,
  Calendar,
  Car,
  User,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import type { Location, PricingRule } from '@/types';
import {
  getActiveLocationsAction,
  getRoutePricingAction,
  createBookingAction,
} from '@/app/(customer)/actions';

type Step = 1 | 2 | 3 | 4;

interface BookingFormState {
  pickupLocationId: string;
  destinationLocationId: string;
  tripDateTime: string;
  vehicleClass: 'standard' | 'executive' | 'van';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const VEHICLE_OPTIONS = [
  {
    id: 'standard' as const,
    label: 'Standard',
    desc: 'Comfortable sedan for up to 3 passengers',
    icon: '🚗',
  },
  {
    id: 'executive' as const,
    label: 'Executive',
    desc: 'Premium vehicle for business travel',
    icon: '🚘',
  },
  {
    id: 'van' as const,
    label: 'Van',
    desc: 'Spacious van for groups up to 7',
    icon: '🚐',
  },
];

export default function BookingForm() {
  const [step, setStep] = useState<Step>(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [form, setForm] = useState<BookingFormState>({
    pickupLocationId: '',
    destinationLocationId: '',
    tripDateTime: '',
    vehicleClass: 'standard',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [successBooking, setSuccessBooking] = useState<{ referenceId: string } | null>(null);

  useEffect(() => {
    getActiveLocationsAction().then((res) => {
      if (res.success) setLocations(res.data);
    });
  }, []);

  useEffect(() => {
    if (form.pickupLocationId && form.destinationLocationId) {
      getRoutePricingAction(form.pickupLocationId, form.destinationLocationId).then((res) => {
        if (res.success) setPricingRules(res.data);
        else setPricingRules([]);
      });
    }
  }, [form.pickupLocationId, form.destinationLocationId]);

  const selectedPricing = pricingRules.find((r) => r.vehicle_class === form.vehicleClass);

  const updateField = (field: keyof BookingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createBookingAction({
        ...form,
        tripDateTime: new Date(form.tripDateTime).toISOString(),
      });

      if (result.success) {
        setSuccessBooking({ referenceId: result.data.reference_id });
        setStep(4);
      } else {
        const fieldErrors: Record<string, string> = {};
        if (result.validationErrors) {
          Object.entries(result.validationErrors).forEach(([key, msgs]) => {
            fieldErrors[key] = msgs[0];
          });
        } else {
          fieldErrors._general = result.error;
        }
        setErrors(fieldErrors);
      }
    });
  };

  // Step 4: Success screen
  if (step === 4 && successBooking) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-6 glow">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
        <p className="text-slate-400">Your booking reference is:</p>
        <div className="inline-block bg-indigo-500/20 border border-indigo-500/30 rounded-xl px-8 py-4">
          <span className="text-3xl font-mono font-bold gradient-text">
            {successBooking.referenceId}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          We&apos;ll confirm your booking shortly. A driver will be assigned and you&apos;ll be notified.
        </p>
        <button
          id="book-another-btn"
          onClick={() => {
            setStep(1);
            setSuccessBooking(null);
            setForm({
              pickupLocationId: '',
              destinationLocationId: '',
              tripDateTime: '',
              vehicleClass: 'standard',
              customerName: '',
              customerEmail: '',
              customerPhone: '',
            });
          }}
          className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Book Another Ride <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden glow">
      {/* Step indicator */}
      <div className="flex border-b border-white/10">
        {['Route', 'Vehicle', 'Details'].map((label, idx) => {
          const s = (idx + 1) as Step;
          return (
            <button
              key={label}
              id={`step-${s}-tab`}
              onClick={() => step > s && setStep(s)}
              className={`flex-1 py-4 text-sm font-medium transition-all ${
                step === s
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : step > s
                  ? 'text-emerald-400 cursor-pointer hover:text-emerald-300'
                  : 'text-slate-500 cursor-default'
              }`}
            >
              <span className="mr-2">{step > s ? '✓' : s}</span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="p-8 space-y-6">
        {/* Step 1: Route & Date */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">Select your route & travel time</h3>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="pickup-location">
                <MapPin className="inline w-4 h-4 mr-1" />Pickup Location
              </label>
              <select
                id="pickup-location"
                value={form.pickupLocationId}
                onChange={(e) => updateField('pickupLocationId', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                <option value="">Select pickup...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
              {errors.pickupLocationId && (
                <p className="text-red-400 text-xs mt-1">{errors.pickupLocationId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="destination-location">
                <MapPin className="inline w-4 h-4 mr-1" />Destination
              </label>
              <select
                id="destination-location"
                value={form.destinationLocationId}
                onChange={(e) => updateField('destinationLocationId', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                <option value="">Select destination...</option>
                {locations
                  .filter((l) => l.id !== form.pickupLocationId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
              </select>
              {errors.destinationLocationId && (
                <p className="text-red-400 text-xs mt-1">{errors.destinationLocationId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="trip-datetime">
                <Calendar className="inline w-4 h-4 mr-1" />Date &amp; Time
              </label>
              <input
                id="trip-datetime"
                type="datetime-local"
                min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                value={form.tripDateTime}
                onChange={(e) => updateField('tripDateTime', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {errors.tripDateTime && (
                <p className="text-red-400 text-xs mt-1">{errors.tripDateTime}</p>
              )}
            </div>

            <button
              id="step1-next-btn"
              onClick={() => {
                if (!form.pickupLocationId) return setErrors({ pickupLocationId: 'Please select a pickup location.' });
                if (!form.destinationLocationId) return setErrors({ destinationLocationId: 'Please select a destination.' });
                if (!form.tripDateTime) return setErrors({ tripDateTime: 'Please select a date and time.' });
                setStep(2);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Vehicle Selection */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">Select your vehicle class</h3>

            <div className="space-y-3">
              {VEHICLE_OPTIONS.map((option) => {
                const pricing = pricingRules.find((r) => r.vehicle_class === option.id);
                return (
                  <button
                    key={option.id}
                    id={`vehicle-${option.id}`}
                    onClick={() => updateField('vehicleClass', option.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                      form.vehicleClass === option.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{option.icon}</span>
                      <div>
                        <p className="font-semibold text-white">{option.label}</p>
                        <p className="text-sm text-slate-400">{option.desc}</p>
                      </div>
                    </div>
                    {pricing ? (
                      <span className="text-lg font-bold text-emerald-400">${pricing.price}</span>
                    ) : (
                      <span className="text-sm text-slate-500">N/A</span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPricing && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
                <span className="text-slate-300">Estimated Total</span>
                <span className="text-2xl font-bold text-emerald-400">${selectedPricing.price}</span>
              </div>
            )}

            {pricingRules.length === 0 && form.pickupLocationId && form.destinationLocationId && (
              <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No pricing rules found for this route. Please contact us.
              </div>
            )}

            <div className="flex gap-3">
              <button
                id="step2-back-btn"
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-semibold transition-all"
              >
                Back
              </button>
              <button
                id="step2-next-btn"
                onClick={() => {
                  if (!selectedPricing) return setErrors({ vehicleClass: 'No pricing for this vehicle on this route.' });
                  setStep(3);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">Your details</h3>

            {errors._general && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors._general}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="customer-name">
                <User className="inline w-4 h-4 mr-1" />Full Name
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="John Doe"
                value={form.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {errors.customerName && (
                <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="customer-email">
                <Mail className="inline w-4 h-4 mr-1" />Email Address
              </label>
              <input
                id="customer-email"
                type="email"
                placeholder="john@example.com"
                value={form.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {errors.customerEmail && (
                <p className="text-red-400 text-xs mt-1">{errors.customerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2" htmlFor="customer-phone">
                <Phone className="inline w-4 h-4 mr-1" />Phone Number
              </label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="+1 234 567 8901"
                value={form.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {errors.customerPhone && (
                <p className="text-red-400 text-xs mt-1">{errors.customerPhone}</p>
              )}
            </div>

            {/* Booking summary */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-slate-400 font-medium mb-3">Booking Summary</p>
              {selectedPricing && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle</span>
                  <span className="text-white capitalize">{form.vehicleClass}</span>
                </div>
              )}
              {form.tripDateTime && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time</span>
                  <span className="text-white">
                    {new Date(form.tripDateTime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
              {selectedPricing && (
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-emerald-400 font-bold">${selectedPricing.price}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="step3-back-btn"
                onClick={() => setStep(2)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-semibold transition-all"
              >
                Back
              </button>
              <button
                id="submit-booking-btn"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm Booking <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
