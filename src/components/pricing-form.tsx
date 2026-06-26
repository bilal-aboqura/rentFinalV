'use client';

import React, { useState } from 'react';
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    const priceNum = parseFloat(price);
    const formData = {
      pickupLocationId,
      destinationLocationId,
      price: isNaN(priceNum) ? undefined : priceNum,
    };

    // Client-side Zod validation
    const schema = initialData ? UpdateRoutePriceSchema : CreateRoutePriceSchema;
    const validationInput = initialData ? { id: initialData.id, ...formData } : formData;
    const validation = schema.safeParse(validationInput);

    if (!validation.success) {
      const fieldErrors: { [key: string]: string } = {};
      validation.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // Call submit action
    const result = await onSubmit(validation.data);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      if (result.validationErrors) {
        const actionErrors: { [key: string]: string } = {};
        Object.keys(result.validationErrors).forEach(key => {
          actionErrors[key] = result.validationErrors?.[key]?.[0] ?? 'Invalid value.';
        });
        setErrors(actionErrors);
      } else if (result.error) {
        setSubmitError(result.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Edit Route Price' : 'Add Route Price'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="p-3 bg-red-950/50 border border-red-900 text-red-200 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          {/* Pickup Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              From (Pickup Location)
            </label>
            <select
              value={pickupLocationId}
              onChange={e => setPickupLocationId(e.target.value)}
              disabled={!!initialData} // Lock location on edit to prevent accidental mapping shifts
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-55"
            >
              <option value="">Select pickup location...</option>
              {activeLocations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
            {errors.pickupLocationId && (
              <p className="mt-1 text-sm text-red-500">{errors.pickupLocationId}</p>
            )}
          </div>

          {/* Destination Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              To (Destination Location)
            </label>
            <select
              value={destinationLocationId}
              onChange={e => setDestinationLocationId(e.target.value)}
              disabled={!!initialData} // Lock location on edit
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-55"
            >
              <option value="">Select destination location...</option>
              {activeLocations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
            {errors.destinationLocationId && (
              <p className="mt-1 text-sm text-red-500">{errors.destinationLocationId}</p>
            )}
          </div>

          {/* Price Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
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

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
