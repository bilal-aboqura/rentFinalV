'use client';

import React, { useState } from 'react';
import { Location, LocationType } from '@/types';
import { CreateLocationSchema, UpdateLocationSchema } from '@/lib/validation/location';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: unknown
  ) => Promise<{ success: boolean; error?: string; validationErrors?: Record<string, string[]> }>;
  initialData?: Location | null;
}

const LOCATION_TYPES: LocationType[] = ['City', 'Airport', 'Pickup Point'];

export default function LocationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: LocationFormProps) {
  // Initialized from props on mount. The parent mounts this component
  // conditionally (only when the modal is open), so a fresh mount each
  // time gives us a clean reset without setState-in-effect.
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<LocationType>(initialData?.type ?? 'City');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    const formData = { name, type, isActive };

    // Client-side Zod validation
    const schema = initialData ? UpdateLocationSchema : CreateLocationSchema;
    const validationInput = initialData ? { id: initialData.id, ...formData } : formData;
    const validation = schema.safeParse(validationInput);

    if (!validation.success) {
      const fieldErrors: { [key: string]: string } = {};
      validation.error.issues.forEach(issue => {
        const path = String(issue.path[0] ?? '_');
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    const result = await onSubmit(validation.data);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else if (result.validationErrors) {
      const actionErrors: { [key: string]: string } = {};
      Object.keys(result.validationErrors).forEach(key => {
        const msgs = result.validationErrors![key];
        if (msgs && msgs.length) actionErrors[key] = msgs[0];
      });
      setErrors(actionErrors);
    } else if (result.error) {
      setSubmitError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Edit Location' : 'Add Location'}
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

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Location Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Boston Logan Airport"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Type Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={e => setType(e.target.value as LocationType)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {LOCATION_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3">
            <div>
              <span className="block text-sm font-medium text-slate-200">Active Status</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Only active locations appear in customer booking dropdowns.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isActive ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
