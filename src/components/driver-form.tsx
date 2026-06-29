'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { DriverRecord } from '@/lib/validation/driver';

interface DriverFormProps {
  /** Existing driver data when in edit mode */
  driver?: DriverRecord;
  onSuccess: () => void;
  onCancel: () => void;
  createAction: (input: unknown) => Promise<{
    success: boolean;
    data?: DriverRecord;
    validationErrors?: Record<string, string[]>;
    error?: string;
  }>;
  updateAction: (input: unknown) => Promise<{
    success: boolean;
    data?: DriverRecord;
    validationErrors?: Record<string, string[]>;
    error?: string;
  }>;
}

const STATUS_OPTIONS = ['Available', 'Busy', 'Inactive'] as const;
type AvailabilityStatus = (typeof STATUS_OPTIONS)[number];

export default function DriverForm({
  driver,
  onSuccess,
  onCancel,
  createAction,
  updateAction,
}: DriverFormProps) {
  const isEditMode = !!driver;
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(driver?.name ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [status, setStatus] = useState<AvailabilityStatus>(
    (driver?.availability_status as AvailabilityStatus) ?? 'Available'
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState('');

  // Sync form when driver prop changes (e.g., switching from one edit to another)
  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setPhone(driver.phone);
      setStatus(driver.availability_status as AvailabilityStatus);
    }
  }, [driver]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setServerError('');

    startTransition(async () => {
      const input = isEditMode
        ? { id: driver.id, name, phone, availability_status: status }
        : { name, phone, availability_status: status };

      const action = isEditMode ? updateAction : createAction;
      const result = await action(input);

      if (result.success) {
        onSuccess();
      } else {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        } else if (result.error) {
          setServerError(result.error);
        }
      }
    });
  };

  const statusColors: Record<AvailabilityStatus, string> = {
    Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Busy: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Inactive: 'bg-slate-700 text-slate-400 border-slate-600',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {serverError}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-form-name">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="driver-form-name"
            type="text"
            placeholder="Ahmed Al-Rashid"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-60"
          />
          {validationErrors.name?.[0] && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.name[0]}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-form-phone">
            Phone <span className="text-red-400">*</span>
          </label>
          <input
            id="driver-form-phone"
            type="tel"
            placeholder="+1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
            className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 disabled:opacity-60"
          />
          {validationErrors.phone?.[0] && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.phone[0]}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-form-status">
            Availability Status
          </label>
          <select
            id="driver-form-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as AvailabilityStatus)}
            disabled={isPending}
            className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {validationErrors.availability_status?.[0] && (
            <p className="text-red-400 text-xs mt-1">
              {validationErrors.availability_status[0]}
            </p>
          )}
          {/* Preview badge */}
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          id="driver-form-save-btn"
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isEditMode ? 'Save Changes' : 'Add Driver'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
