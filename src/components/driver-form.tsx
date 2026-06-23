'use client';

import React, { useState, useEffect } from 'react';
import { Driver } from '@/types';
import { CreateDriverSchema, UpdateDriverSchema } from '@/lib/validation/driver';

interface DriverFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string; validationErrors?: any }>;
  initialData?: Driver | null;
}

export default function DriverForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: DriverFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'Available' | 'Busy' | 'Inactive'>('Available');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setAvailabilityStatus(initialData.availability_status);
    } else {
      setName('');
      setPhone('');
      setAvailabilityStatus('Available');
    }
    setErrors({});
    setSubmitError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    const formData = {
      name,
      phone,
      availability_status: availabilityStatus,
    };

    // Client-side Zod validation
    const schema = initialData ? UpdateDriverSchema : CreateDriverSchema;
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
          actionErrors[key] = (result.validationErrors as any)[key][0];
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
            {initialData ? 'Edit Driver' : 'Add New Driver'}
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
              Driver Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. +1 (555) 123-4567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Availability Status
            </label>
            <select
              value={availabilityStatus}
              onChange={e => setAvailabilityStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.availability_status && (
              <p className="mt-1 text-sm text-red-500">{errors.availability_status}</p>
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
              {isSubmitting ? 'Saving...' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
