'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  CreateRoutePriceInput,
  Location,
  RoutePrice,
  UpdateRoutePriceInput,
} from '@/types';
import { CreateRoutePriceSchema, UpdateRoutePriceSchema } from '@/lib/validation/pricing';

interface PricingFormProps {
  onClose: () => void;
  onSubmit: (
    data: CreateRoutePriceInput | UpdateRoutePriceInput
  ) => Promise<{ success: boolean; error?: string; validationErrors?: Record<string, string[]> }>;
  initialData?: RoutePrice | null;
  activeLocations: Location[];
}

const inactiveOptionFor = (
  routeId: string | undefined,
  routeName: string | undefined,
  activeLocations: Location[],
  fallbackName: string
): Location[] => {
  if (!routeId || activeLocations.some(loc => loc.id === routeId)) return [];
  return [{
    id: routeId,
    name: routeName || fallbackName,
    type: 'Pickup Point',
    isActive: false,
  }];
};

const fieldErrorsFromIssues = (issues: { path: PropertyKey[]; message: string }[]) => {
  const fieldErrors: Record<string, string> = {};
  issues.forEach(issue => {
    const path = String(issue.path[0] ?? 'form');
    fieldErrors[path] = issue.message;
  });
  return fieldErrors;
};

export default function PricingForm({
  onClose,
  onSubmit,
  initialData,
  activeLocations,
}: PricingFormProps) {
  const [pickupLocationId, setPickupLocationId] = useState(initialData?.pickupLocationId ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(
    initialData?.destinationLocationId ?? ''
  );
  const [price, setPrice] = useState(initialData?.price.toString() ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickupOptions = [
    ...inactiveOptionFor(
      initialData?.pickupLocationId,
      initialData?.pickupLocationName,
      activeLocations,
      'Inactive pickup location'
    ),
    ...activeLocations,
  ];
  const destinationOptions = [
    ...inactiveOptionFor(
      initialData?.destinationLocationId,
      initialData?.destinationLocationName,
      activeLocations,
      'Inactive destination location'
    ),
    ...activeLocations,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    const priceNumber = Number.parseFloat(price);
    const formData = {
      pickupLocationId,
      destinationLocationId,
      price: Number.isNaN(priceNumber) ? undefined : priceNumber,
    };
    const validationInput = initialData ? { id: initialData.id, ...formData } : formData;
    const schema = initialData ? UpdateRoutePriceSchema : CreateRoutePriceSchema;
    const validation = schema.safeParse(validationInput);

    if (!validation.success) {
      setErrors(fieldErrorsFromIssues(validation.error.issues));
      setIsSubmitting(false);
      return;
    }

    const result = await onSubmit(validation.data);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
      return;
    }

    if (result.validationErrors) {
      const actionErrors: Record<string, string> = {};
      Object.entries(result.validationErrors).forEach(([key, value]) => {
        actionErrors[key] = value[0] || 'Invalid value.';
      });
      setErrors(actionErrors);
      return;
    }

    setSubmitError(result.error || 'Failed to save pricing rule.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Edit Route Price' : 'Add Route Price'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pricing form"
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="p-3 bg-red-950/50 border border-red-900 text-red-200 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          {errors.form && (
            <div className="p-3 bg-red-950/50 border border-red-900 text-red-200 rounded-lg text-sm">
              {errors.form}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              From (Pickup Location)
            </label>
            <select
              value={pickupLocationId}
              onChange={e => setPickupLocationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select pickup location...</option>
              {pickupOptions.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type}{loc.isActive === false ? ', inactive' : ''})
                </option>
              ))}
            </select>
            {errors.pickupLocationId && (
              <p className="mt-1 text-sm text-red-500">{errors.pickupLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              To (Destination Location)
            </label>
            <select
              value={destinationLocationId}
              onChange={e => setDestinationLocationId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select destination location...</option>
              {destinationOptions.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type}{loc.isActive === false ? ', inactive' : ''})
                </option>
              ))}
            </select>
            {errors.destinationLocationId && (
              <p className="mt-1 text-sm text-red-500">{errors.destinationLocationId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
