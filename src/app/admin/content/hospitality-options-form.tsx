'use client';

import { FormEvent, useState, useTransition } from 'react';
import { Coffee, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import {
  deleteHospitalityOptionAction,
  saveHospitalityOptionAction,
} from '@/app/actions/cms';
import type { HospitalityOption, SaveHospitalityOptionInput } from '@/types';

interface HospitalityOptionsFormProps {
  initialOptions: HospitalityOption[];
}

const EMPTY_FORM: SaveHospitalityOptionInput = {
  name: '',
  name_ar: '',
  sort_order: 0,
  is_active: true,
};

export default function HospitalityOptionsForm({
  initialOptions,
}: HospitalityOptionsFormProps) {
  const [options, setOptions] = useState(initialOptions);
  const [form, setForm] = useState<SaveHospitalityOptionInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [isPending, startTransition] = useTransition();

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--cms-primary)] focus:outline-none';
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved('');

    startTransition(async () => {
      const result = await saveHospitalityOptionAction({
        ...form,
        id: editingId ?? undefined,
        sort_order: Number(form.sort_order ?? 0),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setOptions((current) => {
        const withoutCurrent = current.filter((item) => item.id !== result.data.id);
        return [...withoutCurrent, result.data].sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.created_at.localeCompare(b.created_at);
        });
      });
      resetForm();
      setSaved('تم حفظ عنصر الضيافة بنجاح.');
    });
  };

  const handleEdit = (option: HospitalityOption) => {
    setEditingId(option.id);
    setForm({
      id: option.id,
      name: option.name,
      name_ar: option.name_ar,
      sort_order: option.sort_order,
      is_active: option.is_active,
    });
    setError('');
    setSaved('');
  };

  const handleDelete = (option: HospitalityOption) => {
    if (!window.confirm(`حذف خيار الضيافة "${option.name_ar}"؟`)) return;
    setError('');
    setSaved('');

    startTransition(async () => {
      const result = await deleteHospitalityOptionAction(option.id);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setOptions((current) => current.filter((item) => item.id !== result.data.id));
      if (editingId === result.data.id) resetForm();
      setSaved('تم حذف عنصر الضيافة.');
    });
  };

  return (
    <section className="admin-panel space-y-5 p-5">
      <div className="flex items-center gap-2">
        <Coffee className="h-5 w-5 text-[var(--cms-primary)]" />
        <div>
          <h2 className="text-lg font-semibold text-slate-800">الضيافة المجانية</h2>
          <p className="text-xs text-slate-500">
            الأدمن فقط هو الذي يحدد عناصر الضيافة التي تظهر للمسافر أثناء الحجز، مثل الشاي أو القهوة.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">
            {editingId ? 'تعديل عنصر ضيافة' : 'إضافة عنصر ضيافة'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="hospitality-name-ar">
              الاسم بالعربية
            </label>
            <input
              id="hospitality-name-ar"
              className={inputClass}
              value={form.name_ar}
              onChange={(event) => setForm({ ...form, name_ar: event.target.value })}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="hospitality-name-en">
              English name
            </label>
            <input
              id="hospitality-name-en"
              className={inputClass}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="hospitality-sort">
              ترتيب الظهور
            </label>
            <input
              id="hospitality-sort"
              type="number"
              className={inputClass}
              value={form.sort_order ?? 0}
              onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active ?? true}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              className="h-4 w-4"
            />
            يظهر للمسافر في صفحة الحجز
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'حفظ التعديل' : 'إضافة العنصر'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">{saved}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500">
            <tr>
              <th className="px-3 py-2 text-start">العربية</th>
              <th className="px-3 py-2 text-start">English</th>
              <th className="px-3 py-2 text-start">الترتيب</th>
              <th className="px-3 py-2 text-start">الحالة</th>
              <th className="px-3 py-2 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {options.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-slate-500" colSpan={5}>
                  لا توجد عناصر ضيافة بعد.
                </td>
              </tr>
            ) : (
              options.map((option) => (
                <tr key={option.id}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{option.name_ar}</td>
                  <td className="px-3 py-2 text-slate-600" dir="ltr">
                    {option.name}
                  </td>
                  <td className="px-3 py-2 text-slate-600" dir="ltr">
                    {option.sort_order}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        option.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {option.is_active ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(option)}
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(option)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        aria-label="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
