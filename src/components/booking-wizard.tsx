'use client';

import React, { useState, useEffect } from 'react';
import { Location } from '@/types';
import { fetchActiveLocationsAction } from '@/lib/api/customerLocations';
import BookingWizardStep1 from './booking-wizard-step1';
import { Calculator, CheckCircle2, User, Mail, Phone, Calendar, Clock, MapPin, Navigation, ArrowLeft, ArrowRight } from 'lucide-react';

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Persisted state from Step 1
  const [step1Data, setStep1Data] = useState<{
    pickupId: string;
    destinationId: string;
    date: string;
    time: string;
    price: number;
  } | null>(null);

  // Mock Step 2 Customer Details state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Load active locations on mount
  useEffect(() => {
    async function loadLocations() {
      const res = await fetchActiveLocationsAction();
      if (res.success && res.data) {
        setLocations(res.data);
      } else {
        setErrorMessage('Failed to load available locations. Please try again.');
      }
      setLoadingLocations(false);
    }
    loadLocations();
  }, []);

  const handleStep1Next = (data: {
    pickupId: string;
    destinationId: string;
    date: string;
    time: string;
    price: number;
  }) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      setErrorMessage('Please fill in all customer details.');
      return;
    }
    setBookingSuccess(true);
  };

  const pickupLocationName = locations.find(l => l.id === step1Data?.pickupId)?.name || 'Selected Pickup';
  const destinationLocationName = locations.find(l => l.id === step1Data?.destinationId)?.name || 'Selected Destination';

  if (bookingSuccess) {
    return (
      <div className="w-full max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="inline-flex p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl mb-2">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Booking Requested!</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Your route, pricing, schedule, and customer details have been successfully captured and validated. 
        </p>

        {/* Summary Table */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-5 text-left text-xs space-y-3.5 divide-y divide-slate-850">
          <div className="flex justify-between items-center text-slate-400 pt-0">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Route Details</span>
          </div>
          <div className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-slate-300 font-medium">{pickupLocationName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium">{destinationLocationName}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">{step1Data?.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">{step1Data?.time}</span>
            </div>
          </div>
          <div className="pt-3.5 flex justify-between items-center">
            <span className="text-slate-400">Total Price Quote:</span>
            <span className="text-white font-black text-lg">${step1Data?.price.toFixed(2)}</span>
          </div>
          <div className="pt-3.5 space-y-1.5">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Customer Info</span>
            <div className="text-slate-300 font-medium">{customerName}</div>
            <div className="text-slate-400">{customerEmail}</div>
            <div className="text-slate-400">{customerPhone}</div>
          </div>
        </div>

        <button
          onClick={() => {
            setStep(1);
            setStep1Data(null);
            setCustomerName('');
            setCustomerEmail('');
            setCustomerPhone('');
            setBookingSuccess(false);
          }}
          className="w-full bg-slate-800 hover:bg-slate-750 text-white rounded-xl py-3.5 font-bold transition-all text-sm uppercase tracking-wider cursor-pointer"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between mb-6 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40 px-4 py-2.5 rounded-full border border-slate-850">
        <span className={step === 1 ? 'text-blue-400 font-bold' : ''}>1. Route & Time</span>
        <ArrowRight className="w-3 h-3 text-slate-600" />
        <span className={step === 2 ? 'text-blue-400 font-bold' : ''}>2. Passenger Info</span>
      </div>

      {/* Main Icon & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-3">
          <Calculator className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {step === 1 ? 'Instant Price Calculator' : 'Passenger Details'}
        </h2>
        <p className="text-slate-400 text-sm mt-1.5">
          {step === 1
            ? 'Select your locations to calculate your flat-rate transfer price instantly.'
            : 'Provide your contact information to finalize the booking details.'}
        </p>
      </div>

      {errorMessage && step === 2 && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      {step === 1 ? (
        <BookingWizardStep1
          locations={locations}
          loadingLocations={loadingLocations}
          initialData={step1Data || undefined}
          onNext={handleStep1Next}
        />
      ) : (
        <form onSubmit={handleStep2Submit} className="space-y-6">
          {/* Passenger Info form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm shadow-inner"
              />
            </div>
          </div>

          {/* Pricing Quote Summary */}
          <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500">Route Fare Quote</span>
              <div className="text-slate-300 font-medium">
                {pickupLocationName.split(' ')[0]} to {destinationLocationName.split(' ')[0]}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Total Price</span>
              <div className="text-white font-black text-xl">${step1Data?.price.toFixed(2)}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleStep2Back}
              className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white rounded-xl px-5 py-4 font-bold transition-all text-sm uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-4 font-bold shadow-xl shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
            >
              <span>Confirm Booking Request</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
