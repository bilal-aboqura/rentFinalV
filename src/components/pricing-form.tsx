'use client';

/**
 * T012 [US2] / T016 [US3]
 * Add / Edit Route Price modal form component.
 *
 * Spec: specs/003-pricing-management/spec.md
 */

import React, { useState, useTransition, useEffect } from 'react';
import { X, DollarSign, Loader2, Route } from 'lucide-react';
import {
  createRoutePriceAction,
  updateRoutePriceAction,
} from '@/app/admin/pricing/actions';
import type { RoutePriceRow } from '@/lib/validation/pricing';
import type { LocationRow } from '@/lib/validation/location';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface PricingFormModalProps {
  mode: 'create' | 'edit';
  initialData?: RoutePriceRow;
  locations: LocationRow[];
  onClose: () => void;
  onSuccess: (routePrice: RoutePriceRow) => void;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function PricingFormModal({
  mode,
  initialData,
  locations,
  onClose,
  onSuccess,
}: PricingFormModalProps) {
  const [pickupLocationId, setPickupLocationId] = useState(
    initialData?.pickup_location_id ?? ''
  );
  const [destinationLocationId, setDestinationLocationId] = useState(
    initialData?.destination_location_id ?? ''
  );
  const [priceStr, setPriceStr] = useState(
    initialData?.price ? String(initialData.price) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  // Reset form when mode/initialData changes
  useEffect(() => {
    setPickupLocationId(initialData?.pickup_location_id ?? '');
    setDestinationLocationId(initialData?.destination_location_id ?? '');
    setPriceStr(initialData?.price ? String(initialData.price) : '');
    setError(null);
    setValidationErrors({});
  }, [initialData, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const price = parseFloat(priceStr);

    startTransition(async () => {
      let result;
      if (mode === 'create') {
        result = await createRoutePriceAction({
          pickupLocationId,
          destinationLocationId,
          price,
        });
      } else {
        result = await updateRoutePriceAction({
          id: initialData!.id,
          pickupLocationId,
          destinationLocationId,
          price,
        });
      }

      if (result.success && result.data) {
        onSuccess(result.data);
      } else if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors as Record<string, string[]>);
        }
        setError(result.error ?? 'An unexpected error occurred.');
      }
    });
  };

  // Active locations only
  const activeLocations = locations.filter((l) => l.is_active);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      id="pricing-form-modal"
    >
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Add Route Price' : 'Edit Route Price'}
            </h2>
          </div>
          <button
            id="pricing-form-close-btn"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} id="pricing-form" className="space-y-4">
          {/* Pickup Location */}
          <div>
            <label htmlFor="pricing-pickup" className="block text-sm text-slate-400 mb-1">
              Pickup Location
            </label>
            <select
              id="pricing-pickup"
              value={pickupLocationId}
              onChange={(e) => setPickupLocationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
              required
            >
              <option value="" disabled>
                Select pickup location…
              </option>
              {activeLocations
                .filter((l) => l.id !== destinationLocationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
            </select>
            {validationErrors.pickupLocationId?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-400">
                {msg}
              </p>
            ))}
          </div>

          {/* Destination Location */}
          <div>
            <label htmlFor="pricing-destination" className="block text-sm text-slate-400 mb-1">
              Destination Location
            </label>
            <select
              id="pricing-destination"
              value={destinationLocationId}
              onChange={(e) => setDestinationLocationId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none"
              required
            >
              <option value="" disabled>
                Select destination location…
              </option>
              {activeLocations
                .filter((l) => l.id !== pickupLocationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
            </select>
            {validationErrors.destinationLocationId?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-400">
                {msg}
              </p>
            ))}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="pricing-price" className="block text-sm text-slate-400 mb-1">
              Price (flat rate)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                $
              </span>
              <input
                id="pricing-price"
                type="number"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                required
              />
            </div>
            {validationErrors.price?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-400">
                {msg}
              </p>
            ))}
          </div>

          {/* Global error */}
          {error && (
            <div
              id="pricing-form-error"
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="pricing-form-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              id="pricing-form-submit-btn"
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all text-sm font-medium"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : mode === 'create' ? (
                'Add Route Price'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Delete Confirmation Modal
// ----------------------------------------------------------------
interface DeletePricingConfirmModalProps {
  routePrice: RoutePriceRow;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeletePricingConfirmModal({
  routePrice,
  onClose,
  onConfirm,
  isPending,
}: DeletePricingConfirmModalProps) {
  const label =
    routePrice.pickup_location_name && routePrice.destination_location_name
      ? `${routePrice.pickup_location_name} → ${routePrice.destination_location_name}`
      : `Route #${routePrice.id.slice(0, 8)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      id="pricing-delete-modal"
    >
      <div className="relative w-full max-w-sm glass rounded-2xl border border-red-500/20 shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Delete Pricing Rule?</h2>
            <p className="text-sm text-slate-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6">
          You are about to permanently delete the pricing rule for{' '}
          <span className="text-white font-medium">{label}</span>.
        </p>

        <div className="flex items-center gap-3">
          <button
            id="pricing-delete-cancel-btn"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            id="pricing-delete-confirm-btn"
            onClick={() => onConfirm(routePrice.id)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-all text-sm font-medium"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
