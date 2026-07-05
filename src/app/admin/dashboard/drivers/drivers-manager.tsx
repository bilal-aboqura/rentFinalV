'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Driver } from '@/types';
import {
  createDriverAction,
  updateDriverAction,
  deleteDriverAction,
} from '@/app/admin/dashboard/actions';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle, Car } from 'lucide-react';

interface Props {
  drivers: Driver[];
}

const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
};

export default function DriversManager({ drivers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', licensePlate: '', status: 'active' as 'active' | 'inactive' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm({ name: '', phone: '', licensePlate: '', status: 'active' });
    setValidationErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    setValidationErrors({});
    startTransition(async () => {
      const input = editingId ? { id: editingId, ...form } : form;
      const result = editingId ? await updateDriverAction(input) : await createDriverAction(input);

      if (result.success) {
        setSuccess(editingId ? 'تم تحديث بيانات السائق.' : 'تمت إضافة السائق.');
        resetForm();
        router.refresh();
      } else if (result.validationErrors) {
        const errs: Record<string, string> = {};
        Object.entries(result.validationErrors).forEach(([k, msgs]) => {
          errs[k] = msgs[0];
        });
        setValidationErrors(errs);
      } else {
        setError(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السائق؟ لا يمكن التراجع عن ذلك.')) return;
    setError('');
    startTransition(async () => {
      const result = await deleteDriverAction(id);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  const startEdit = (driver: Driver) => {
    setForm({
      name: driver.name,
      phone: driver.phone,
      licensePlate: driver.license_plate,
      status: driver.status === 'inactive' ? 'inactive' : 'active',
    });
    setEditingId(driver.id);
    setShowForm(true);
  };

  const handleToggleStatus = (driver: Driver) => {
    const next = driver.status === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const result = await updateDriverAction({ id: driver.id, status: next });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {!showForm && (
        <button
          id="add-driver-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> إضافة سائق
        </button>
      )}

      {showForm && (
        <div className="glass space-y-4 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-900">
            {editingId ? 'تعديل السائق' : 'سائق جديد'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-name">
                الاسم الكامل
              </label>
              <input
                id="driver-name"
                type="text"
                placeholder="اسم السائق"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              {validationErrors.name && <p className="mt-1 text-xs text-red-500">{validationErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-phone">
                الهاتف
              </label>
              <input
                id="driver-phone"
                type="tel"
                dir="ltr"
                placeholder="+201000000000"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              {validationErrors.phone && <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-plate">
                لوحة السيارة
              </label>
              <input
                id="driver-plate"
                type="text"
                dir="ltr"
                placeholder="ABC123"
                value={form.licensePlate}
                onChange={(e) => setForm((p) => ({ ...p, licensePlate: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              {validationErrors.licensePlate && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.licensePlate}</p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500" htmlFor="driver-status">
              الحالة
            </label>
            <select
              id="driver-status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none sm:max-w-xs"
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              id="driver-form-save-btn"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-60 sm:w-auto"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? 'حفظ التعديلات' : 'إضافة السائق'}
            </button>
            <button
              onClick={resetForm}
              className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-900 transition-all hover:bg-slate-200 sm:w-auto"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl">
        {drivers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Car className="mx-auto mb-3 h-8 w-8 opacity-30" />
            لا يوجد سائقون بعد. أضف أول سائق للبدء.
          </div>
        ) : (
          <>
          <div className="mobile-card-list p-3 md:hidden">
            {drivers.map((driver) => (
              <article key={driver.id} className="mobile-data-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{driver.name}</p>
                    <p className="mt-1 text-xs text-slate-500" dir="ltr">{driver.phone}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(driver)}
                    disabled={isPending}
                    title={driver.status === 'active' ? 'اضغط لإلغاء التنشيط' : 'اضغط للتنشيط'}
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                      driver.status === 'active'
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                        : 'border-slate-300 bg-slate-100 text-slate-600'
                    }`}
                  >
                    {STATUS_LABELS[driver.status] ?? driver.status}
                  </button>
                </div>
                <div className="mobile-data-row">
                  <span className="mobile-data-label">لوحة السيارة</span>
                  <span className="mobile-data-value font-mono" dir="ltr">{driver.license_plate}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    id={`edit-driver-mobile-${driver.id}`}
                    onClick={() => startEdit(driver)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    تعديل
                  </button>
                  <button
                    id={`delete-driver-mobile-${driver.id}`}
                    onClick={() => handleDelete(driver.id)}
                    disabled={isPending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10">
              <tr className="text-right text-slate-500">
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الهاتف</th>
                <th className="px-5 py-3 font-medium">لوحة السيارة</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-black/5 transition-colors hover:bg-white/40">
                  <td className="px-5 py-4 font-medium text-slate-900">{driver.name}</td>
                  <td className="px-5 py-4 text-slate-700" dir="ltr">{driver.phone}</td>
                  <td className="px-5 py-4 font-mono text-slate-700" dir="ltr">{driver.license_plate}</td>
                  <td className="px-5 py-4">
                    <button
                      id={`toggle-driver-status-${driver.id}`}
                      onClick={() => handleToggleStatus(driver)}
                      disabled={isPending}
                      title={driver.status === 'active' ? 'اضغط لإلغاء التنشيط' : 'اضغط للتنشيط'}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
                        driver.status === 'active'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                          : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          driver.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {STATUS_LABELS[driver.status] ?? driver.status}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        id={`edit-driver-${driver.id}`}
                        onClick={() => startEdit(driver)}
                        className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-indigo-400/10 hover:text-indigo-500"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`delete-driver-${driver.id}`}
                        onClick={() => handleDelete(driver.id)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-slate-500 transition-all hover:bg-red-400/10 hover:text-red-500 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
