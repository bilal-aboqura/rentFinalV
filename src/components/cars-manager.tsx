'use client';

import { useState, useTransition } from 'react';
import { Car as CarIcon, ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  createCarAction,
  deleteCarAction,
  updateCarAction,
  uploadCarImage,
} from '@/app/actions/cars';
import type { Car, VehicleClass } from '@/types';

const VEHICLE_CLASSES: { value: VehicleClass; label: string }[] = [
  { value: 'standard', label: 'عادية' },
  { value: 'executive', label: 'تنفيذية' },
  { value: 'van', label: 'فان / عائلية' },
];

interface FormState {
  name: string;
  name_ar: string;
  vehicle_class: VehicleClass;
  passenger_capacity: number;
  luggage_capacity: number;
  sort_order: number;
  is_active: boolean;
  hospitality_enabled: boolean;
}

const EMPTY: FormState = {
  name: '',
  name_ar: '',
  vehicle_class: 'standard',
  passenger_capacity: 4,
  luggage_capacity: 2,
  sort_order: 0,
  is_active: true,
  hospitality_enabled: false,
};

export function CarsManager({ initialCars }: { initialCars: Car[] }) {
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const action = editingId ? updateCarAction(editingId, form) : createCarAction(form);
      const res = await action;
      if (!res.success) {
        setError(res.error);
        return;
      }
      if (editingId) {
        setCars((prev) => prev.map((c) => (c.id === editingId ? res.data : c)));
      } else {
        setCars((prev) => [...prev, res.data]);
      }
      reset();
    });
  };

  const handleEdit = (car: Car) => {
    setEditingId(car.id);
    setForm({
      name: car.name,
      name_ar: car.name_ar,
      vehicle_class: car.vehicle_class,
      passenger_capacity: car.passenger_capacity,
      luggage_capacity: car.luggage_capacity,
      sort_order: car.sort_order,
      is_active: car.is_active,
      hospitality_enabled: car.hospitality_enabled,
    });
    setError('');
  };

  const handleDelete = (id: string) => {
    setError('');
    startTransition(async () => {
      const res = await deleteCarAction(id);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCars((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleImageUpload = (carId: string, file: File) => {
    setError('');
    setUploadingId(carId);
    const formData = new FormData();
    formData.append('file', file);
    startTransition(async () => {
      const res = await uploadCarImage(carId, formData);
      setUploadingId(null);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setCars((prev) => prev.map((c) => (c.id === carId ? res.data : c)));
    });
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--cms-primary)] focus:outline-none';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">إدارة السيارات</h1>
        <p className="mt-1 text-sm text-slate-500">أضف وعدّل سيارات الأسطول المستخدمة في الحجز. اضغط على صورة السيارة لتغييرها فوراً. الأسعار تُضبط من صفحة التسعير حسب المسار والفئة.</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-panel space-y-4 p-5">
        <h2 className="text-lg font-semibold text-slate-800">
          {editingId ? 'تعديل سيارة' : 'إضافة سيارة'}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">الاسم (إنجليزي)</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Toyota Camry"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">الاسم (عربي)</label>
            <input
              className={inputClass}
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              placeholder="مثال: تويوتا كامري"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">الفئة</label>
            <select
              className={inputClass}
              value={form.vehicle_class}
              onChange={(e) => setForm({ ...form, vehicle_class: e.target.value as VehicleClass })}
            >
              {VEHICLE_CLASSES.map((vc) => (
                <option key={vc.value} value={vc.value}>
                  {vc.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">الركاب</label>
              <input
                type="number"
                min={1}
                max={50}
                className={inputClass}
                value={form.passenger_capacity}
                onChange={(e) =>
                  setForm({ ...form, passenger_capacity: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">الحقائب</label>
              <input
                type="number"
                min={0}
                max={50}
                className={inputClass}
                value={form.luggage_capacity}
                onChange={(e) =>
                  setForm({ ...form, luggage_capacity: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">الترتيب</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full border border-slate-300 bg-slate-200 transition-colors peer-checked:border-emerald-500 peer-checked:bg-emerald-500" />
                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[-16px]" />
              </div>
              <span className={`text-sm font-medium ${form.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>
                مفعّلة
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.hospitality_enabled}
                  onChange={(e) => setForm({ ...form, hospitality_enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full border border-slate-300 bg-slate-200 transition-colors peer-checked:border-amber-500 peer-checked:bg-amber-500" />
                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[-16px]" />
              </div>
              <span className={`text-sm font-medium ${form.hospitality_enabled ? 'text-amber-600' : 'text-slate-500'}`}>
                الضيافة متاحة
              </span>
            </label>
          </div>

        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'حفظ التعديلات' : 'إضافة'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>

      <div className="admin-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-right text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">الصورة</th>
              <th className="px-4 py-3 font-medium">السيارة</th>
              <th className="px-4 py-3 font-medium">الفئة</th>
              <th className="px-4 py-3 font-medium">السعة</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <label className="group relative block h-14 w-20 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {car.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={car.image_url}
                        alt={car.name_ar || car.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-300">
                        {uploadingId === car.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={isPending}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(car.id, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CarIcon className="h-4 w-4 text-[var(--cms-primary)]" />
                    <div>
                      <p className="font-semibold text-slate-900">{car.name_ar || car.name}</p>
                      {car.name_ar && (
                        <p className="text-xs text-slate-500" dir="ltr">
                          {car.name}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {VEHICLE_CLASSES.find((v) => v.value === car.vehicle_class)?.label ??
                    car.vehicle_class}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {car.passenger_capacity} راكب · {car.luggage_capacity} حقيبة
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      car.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {car.is_active ? 'مفعّلة' : 'معطّلة'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(car)}
                      className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:text-[var(--cms-primary)]"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(car.id)}
                      className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:text-red-600"
                      aria-label="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  لا توجد سيارات. أضف أول سيارة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
