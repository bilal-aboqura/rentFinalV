'use client';

import React, { useState, useEffect } from 'react';
import { Location } from '@/types';
import { fetchActiveLocationsAction } from '@/lib/api/customerLocations';
import BookingWizardStep1 from './booking-wizard-step1';
import BookingWizardStep2 from './booking-wizard-step2';
import { submitBookingAction } from '@/app/actions/booking';
import { Calculator, ArrowRight } from 'lucide-react';

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

  // Booking reference and details stored to show success view cleanly
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    pickupName: string;
    destinationName: string;
    date: string;
    time: string;
    price: number;
  } | null>(null);

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

  const handleBookingSubmit = async (step2Data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    flightNumber?: string;
    notes?: string;
  }) => {
    if (!step1Data) {
      return { success: false, error: 'Booking parameter state is missing. Please restart Step 1.' };
    }

    const payload = {
      pickupLocationId: step1Data.pickupId,
      destinationLocationId: step1Data.destinationId,
      date: step1Data.date,
      time: step1Data.time,
      price: step1Data.price,
      customerName: step2Data.customerName,
      customerEmail: step2Data.customerEmail,
      customerPhone: step2Data.customerPhone,
      flightNumber: step2Data.flightNumber || null,
      notes: step2Data.notes || null,
    };

    try {
      const res = await submitBookingAction(payload);
      if (res.success && res.data?.bookingReference) {
        // Cache parameters to display immediately on success screen
        setSuccessDetails({
          pickupName: pickupLocationName,
          destinationName: destinationLocationName,
          date: step1Data.date,
          time: step1Data.time,
          price: step1Data.price,
        });

        // Clear wizard Step 1 state
        setStep1Data(null);
        
        // Save reference to trigger success screen transition
        setBookingReference(res.data.bookingReference);

        return { success: true, bookingReference: res.data.bookingReference };
      } else {
        return {
          success: false,
          error: res.error,
          validationErrors: res.validationErrors
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during submission.';
      return {
        success: false,
        error: message
      };
    }
  };

  const pickupLocationName = locations.find(l => l.id === step1Data?.pickupId)?.name || 'Selected Pickup';
  const destinationLocationName = locations.find(l => l.id === step1Data?.destinationId)?.name || 'Selected Destination';

  // RENDER SUCCESS SCREEN DIRECTLY WITHOUT OUTER SHELL
  if (bookingReference && successDetails) {
    return (
      <BookingWizardStep2
        pickupLocationName={successDetails.pickupName}
        destinationLocationName={successDetails.destinationName}
        date={successDetails.date}
        time={successDetails.time}
        price={successDetails.price}
        onBack={handleStep2Back}
        initialBookingReference={bookingReference}
        onSubmit={handleBookingSubmit}
      />
    );
  }

  // STANDARD STEP WIZARD
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
        <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
          {step === 1
            ? 'Select your locations to calculate your flat-rate transfer price instantly.'
            : 'Provide your contact information to finalize the booking details.'}
        </p>
      </div>

      {errorMessage && (
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
        <BookingWizardStep2
          pickupLocationName={pickupLocationName}
          destinationLocationName={destinationLocationName}
          date={step1Data?.date || ''}
          time={step1Data?.time || ''}
          price={step1Data?.price || 0}
          onBack={handleStep2Back}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  );
}
