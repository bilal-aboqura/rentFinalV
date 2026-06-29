/**
 * T017 — Booking Wizard Parent Orchestrator
 *
 * Manages multi-step booking flow state.
 * Renders BookingWizardStep1 for Step 1 (Route & Time selection).
 * Step 2 (Trip Details) will be implemented in spec 006.
 *
 * Also re-exports GroupedLocationSelect for use by other components.
 */
'use client';

import React, { useState } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import type { GroupedLocations } from '@/lib/utils/groupLocations';
import type { LocationRow } from '@/lib/validation/location';
import { BookingWizardStep1 } from '@/components/booking-wizard-step1';
import type { BookingStep1State } from '@/components/booking-wizard-step1';

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
 * Step 1: Route & Time (BookingWizardStep1)
 * Step 2: Trip Details (spec 006 — placeholder)
 */
export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [step1State, setStep1State] = useState<BookingStep1State | null>(null);

  const handleStep1Next = (state: BookingStep1State) => {
    setStep1State(state);
    setCurrentStep(2);
  };

  const handleBack = () => {
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

        {/* Step 2: Trip Details — placeholder for spec 006 */}
        {currentStep === 2 && step1State && (
          <div className="space-y-5" id="step2-placeholder">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Trip Details</h3>
              <p className="text-sm text-slate-400">
                Step 2 (Trip Details) will be implemented in spec 006.
              </p>
            </div>

            {/* Summary of step 1 selections */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-slate-400 font-medium mb-3">Step 1 Summary</p>
              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span className="text-white">{step1State.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time</span>
                <span className="text-white">{step1State.time}</span>
              </div>
              {step1State.price !== null && (
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-white font-semibold">Route Price</span>
                  <span className="text-emerald-400 font-bold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      step1State.price
                    )}
                  </span>
                </div>
              )}
            </div>

            <button
              id="step2-back-btn"
              onClick={handleBack}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white rounded-xl py-3 font-semibold transition-all"
            >
              ← Back to Route & Time
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
