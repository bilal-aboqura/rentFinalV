/**
 * T008 / T011 / T017 — Booking Wizard Parent Orchestrator
 *
 * Manages multi-step booking flow state.
 * Renders:
 *   - Step 1: BookingWizardStep1 (Route & Time)
 *   - Step 2: BookingWizardStep2 (Passenger Details & Confirmation)
 *
 * Also re-exports GroupedLocationSelect for use by other components.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import type { GroupedLocations } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';
import { BookingWizardStep1 } from '@/components/booking-wizard-step1';
import type { BookingStep1State } from '@/components/booking-wizard-step1';
import { BookingWizardStep2 } from '@/components/booking-wizard-step2';
import { createClient } from '@/lib/supabase/client';

// ----------------------------------------------------------------
// Re-exported: GroupedLocationSelect (for other consumers)
// ----------------------------------------------------------------

interface GroupedLocationSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  groupedLocations: GroupedLocations;
  excludeId?: string;
  placeholder?: string;
}

/**
 * A <select> element that renders active locations grouped by type with <optgroup>.
 */
export function GroupedLocationSelect({
  id,
  label,
  value,
  onChange,
  groupedLocations,
  excludeId,
  placeholder = 'Select a location...',
}: GroupedLocationSelectProps) {
  const GROUP_LABELS: { key: keyof GroupedLocations; label: string }[] = [
    { key: 'City', label: 'Cities' },
    { key: 'Airport', label: 'Airports' },
    { key: 'Pickup Point', label: 'Pickup Points' },
  ];

  const filterExcluded = (locations: LocationRow[]) =>
    excludeId ? locations.filter((l) => l.id !== excludeId) : locations;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          {label}
        </span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {GROUP_LABELS.map(({ key, label: groupLabel }) => {
          const options = filterExcluded(groupedLocations[key]);
          if (options.length === 0) return null;
          return (
            <optgroup key={key} label={groupLabel}>
              {options.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}

// ----------------------------------------------------------------
// Booking Wizard — Parent multi-step orchestrator
// ----------------------------------------------------------------

type WizardStep = 1 | 2;

/**
 * BookingWizard manages multi-step booking state.
 *   Step 1: Route & Time (BookingWizardStep1)
 *   Step 2: Passenger Details & Confirmation (BookingWizardStep2)
 */
export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [step1State, setStep1State] = useState<BookingStep1State | null>(null);
  const [pickupName, setPickupName] = useState('');
  const [destinationName, setDestinationName] = useState('');

  // ── Fetch location names whenever step1State is set ──
  useEffect(() => {
    if (!step1State) return;

    const supabase = createClient();
    supabase
      .from('locations')
      .select('id, name')
      .in('id', [step1State.pickupLocationId, step1State.destinationLocationId])
      .then(({ data }) => {
        if (!data) return;
        setPickupName(data.find((l) => l.id === step1State.pickupLocationId)?.name ?? 'Unknown');
        setDestinationName(data.find((l) => l.id === step1State.destinationLocationId)?.name ?? 'Unknown');
      });
  }, [step1State]);

  const handleStep1Next = (state: BookingStep1State) => {
    setStep1State(state);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  // ── Reset wizard state entirely after successful booking ──
  const handleReset = () => {
    setStep1State(null);
    setPickupName('');
    setDestinationName('');
    setCurrentStep(1);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden glow" id="booking-wizard">
      {/* Step indicator */}
      <div className="flex border-b border-white/10">
        {(['Route & Time', 'Trip Details'] as const).map((label, idx) => {
          const stepNum = (idx + 1) as WizardStep;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;
          return (
            <button
              key={label}
              id={`wizard-step-${stepNum}-tab`}
              onClick={() => isDone && setCurrentStep(stepNum)}
              className={`flex-1 py-4 text-sm font-medium transition-all ${
                isCurrent
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : isDone
                  ? 'text-emerald-400 cursor-pointer hover:text-emerald-300'
                  : 'text-slate-500 cursor-default'
              }`}
            >
              <span className="mr-2">
                {isDone ? <CheckCircle className="inline w-4 h-4 mb-0.5" /> : stepNum}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="p-6 md:p-8">
        {/* Step 1: Route & Time */}
        {currentStep === 1 && <BookingWizardStep1 onNext={handleStep1Next} />}

        {/* Step 2: Passenger Details & Confirmation */}
        {currentStep === 2 && step1State && (
          <BookingWizardStep2
            step1State={step1State}
            pickupLocationName={pickupName}
            destinationLocationName={destinationName}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
