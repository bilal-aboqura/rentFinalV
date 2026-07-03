'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import type { DriverRecord } from '@/lib/validation/driver';

interface DriverFormProps {
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

const STATUS_OPTIONS = ['active', 'inactive'] as const;
type DriverStatus = (typeof STATUS_OPTIONS)[number];

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
  const [licensePlate, setLicensePlate] = useState(driver?.license_plate ?? '');
  const [status, setStatus] = useState<DriverStatus>(
    (driver?.status as DriverStatus) ?? 'active'
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setServerError('');

    startTransition(async () => {
      const input = isEditMode
        ? { id: driver.id, name, phone, licensePlate, status }
        : { name, phone, licensePlate, status };

      const action = isEditMode ? updateAction : createAction;
      const result = await action(input);

      if (result.success) {
        onSuccess();
      } else if (result.validationErrors) {
        setValidationErrors(result.validationErrors);
      } else if (result.error) {
        setServerError(result.error);
      }
    });
  };

  const statusColors: Record<DriverStatus, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    inactive: 'bg-slate-100 text-slate-600 border-slate-300',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-form-name">
            الاسم الكامل <span className="text-red-400">*</span>
          </label>
          <input
            id="driver-form-name"
            type="text"
            placeholder="الاسم الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
          />
          {validationErrors.name?.[0] && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-form-phone">
            الهاتف <span className="text-red-400">*</span>
          </label>
          <input
            id="driver-form-phone"
            type="tel"
            dir="ltr"
            placeholder="+201000000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
          />
          {validationErrors.phone?.[0] && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.phone[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-form-license-plate">
            لوحة السيارة <span className="text-red-400">*</span>
          </label>
          <input
            id="driver-form-license-plate"
            type="text"
            dir="ltr"
            placeholder="ABC-123"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
          />
          {validationErrors.licensePlate?.[0] && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.licensePlate[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-form-status">
            الحالة
          </label>
          <select
            id="driver-form-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as DriverStatus)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'active' ? 'نشط' : 'غير نشط'}
              </option>
            ))}
          </select>
          {validationErrors.status?.[0] && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.status[0]}</p>
          )}
          <div className="mt-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
            >
              {status === 'active' ? 'نشط' : 'غير نشط'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row">
        <button
          id="driver-form-save-btn"
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEditMode ? 'حفظ التعديلات' : 'إضافة سائق'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-900 transition-all hover:bg-slate-200 disabled:opacity-60 sm:w-auto"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
