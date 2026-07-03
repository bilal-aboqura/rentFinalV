'use client';

import React, { useState, useTransition } from 'react';
import { X, DollarSign, Loader2, Route } from 'lucide-react';
import {
  createRoutePriceAction,
  updateRoutePriceAction,
} from '@/app/admin/pricing/actions';
import type { RoutePriceRow } from '@/lib/validation/pricing';
import type { LocationRow } from '@/lib/validation/location';

interface PricingFormModalProps {
  mode: 'create' | 'edit';
  initialData?: RoutePriceRow;
  locations: LocationRow[];
  onClose: () => void;
  onSuccess: (routePrice: RoutePriceRow) => void;
}

const VEHICLE_CLASS_OPTIONS = [
  { value: 'standard', label: 'عادية' },
  { value: 'executive', label: 'تنفيذية' },
  { value: 'van', label: 'فان' },
] as const;

function formatVehicleClass(vehicleClass: RoutePriceRow['vehicle_class']): string {
  if (vehicleClass === 'standard') return 'عادية';
  if (vehicleClass === 'executive') return 'تنفيذية';
  return 'فان';
}

export function PricingFormModal({
  mode,
  initialData,
  locations,
  onClose,
  onSuccess,
}: PricingFormModalProps) {
  const [pickupLocationId, setPickupLocationId] = useState(initialData?.pickup_location_id ?? '');
  const [destinationLocationId, setDestinationLocationId] = useState(
    initialData?.destination_location_id ?? ''
  );
  const [vehicleClass, setVehicleClass] = useState(initialData?.vehicle_class ?? 'standard');
  const [priceStr, setPriceStr] = useState(initialData?.price ? String(initialData.price) : '');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const price = parseFloat(priceStr);

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createRoutePriceAction({
              pickupLocationId,
              destinationLocationId,
              vehicleClass,
              price,
            })
          : await updateRoutePriceAction({
              id: initialData!.id,
              pickupLocationId,
              destinationLocationId,
              vehicleClass,
              price,
            });

      if (result.success && result.data) {
        onSuccess(result.data);
      } else if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors as Record<string, string[]>);
        }
        setError(result.error ?? 'حدث خطأ غير متوقع.');
      }
    });
  };

  const activeLocations = locations.filter((l) => l.status === 'active');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
      id="pricing-form-modal"
    >
      <div className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'create' ? 'إضافة سعر مسار' : 'تعديل سعر المسار'}
            </h2>
          </div>
          <button
            id="pricing-form-close-btn"
            onClick={onClose}
            className="text-slate-500 transition-colors hover:text-slate-900"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="pricing-form" className="space-y-4">
          <div>
            <label htmlFor="pricing-pickup" className="mb-1 block text-sm text-slate-500">
              نقطة الانطلاق
            </label>
            <select
              id="pricing-pickup"
              value={pickupLocationId}
              onChange={(e) => setPickupLocationId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="" disabled>
                اختر نقطة الانطلاق...
              </option>
              {activeLocations
                .filter((l) => l.id !== destinationLocationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type === 'airport' ? 'مطار' : 'مدينة'})
                  </option>
                ))}
            </select>
            {validationErrors.pickupLocationId?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-500">
                {msg}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="pricing-destination" className="mb-1 block text-sm text-slate-500">
              الوجهة
            </label>
            <select
              id="pricing-destination"
              value={destinationLocationId}
              onChange={(e) => setDestinationLocationId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              required
            >
              <option value="" disabled>
                اختر الوجهة...
              </option>
              {activeLocations
                .filter((l) => l.id !== pickupLocationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type === 'airport' ? 'مطار' : 'مدينة'})
                  </option>
                ))}
            </select>
            {validationErrors.destinationLocationId?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-500">
                {msg}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="pricing-vehicle-class" className="mb-1 block text-sm text-slate-500">
              فئة السيارة
            </label>
            <select
              id="pricing-vehicle-class"
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value as typeof vehicleClass)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              required
            >
              {VEHICLE_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {validationErrors.vehicleClass?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-500">
                {msg}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="pricing-price" className="mb-1 block text-sm text-slate-500">
              السعر الثابت
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
              <input
                id="pricing-price"
                type="number"
                dir="ltr"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            {validationErrors.price?.map((msg, i) => (
              <p key={i} className="mt-1 text-xs text-red-500">
                {msg}
              </p>
            ))}
          </div>

          {error && (
            <div
              id="pricing-form-error"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3"
            >
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              id="pricing-form-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              إلغاء
            </button>
            <button
              id="pricing-form-submit-btn"
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : mode === 'create' ? (
                'إضافة السعر'
              ) : (
                'حفظ التعديلات'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      ? `${routePrice.pickup_location_name} ← ${routePrice.destination_location_name}`
      : `المسار #${routePrice.id.slice(0, 8)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
      id="pricing-delete-modal"
    >
      <div className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-red-500/20 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 shrink-0">
            <Route className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">حذف قاعدة التسعير؟</h2>
            <p className="mt-0.5 text-sm text-slate-500">لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-slate-700">
          أنت على وشك حذف قاعدة التسعير الخاصة بـ{' '}
          <span className="font-medium text-slate-900">
            {label} ({formatVehicleClass(routePrice.vehicle_class)})
          </span>
          .
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            id="pricing-delete-cancel-btn"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            إلغاء
          </button>
          <button
            id="pricing-delete-confirm-btn"
            onClick={() => onConfirm(routePrice.id)}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-500 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
}
