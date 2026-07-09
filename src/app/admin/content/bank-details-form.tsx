'use client';

import { FormEvent, useState, useTransition } from 'react';
import { Landmark, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import {
  deleteBankAccountAction,
  saveBankAccountAction,
  updateBankDetailsAction,
} from '@/app/actions/cms';
import type { BankAccount, SaveBankAccountInput } from '@/types';

interface BankDetailsFormProps {
  initial: {
    bank_name: string;
    account_holder_name: string;
    iban: string;
    bank_qr_url: string;
    whatsapp_number: string;
  };
  initialAccounts: BankAccount[];
}

const EMPTY_ACCOUNT_FORM: SaveBankAccountInput = {
  bank_name: '',
  account_holder_name: '',
  iban: '',
  qr_url: '',
  sort_order: 0,
  is_active: true,
};

export default function BankDetailsForm({ initial, initialAccounts }: BankDetailsFormProps) {
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsapp_number);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountForm, setAccountForm] = useState<SaveBankAccountInput>(EMPTY_ACCOUNT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [isPending, startTransition] = useTransition();

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[var(--cms-primary)] focus:outline-none';
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

  const resetAccountForm = () => {
    setAccountForm(EMPTY_ACCOUNT_FORM);
    setEditingId(null);
  };

  const handleWhatsappSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved('');

    startTransition(async () => {
      const res = await updateBankDetailsAction({
        bank_name: initial.bank_name,
        account_holder_name: initial.account_holder_name,
        iban: initial.iban,
        bank_qr_url: initial.bank_qr_url,
        whatsapp_number: whatsappNumber,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setSaved('تم حفظ رقم واتساب استقبال الإيصالات.');
    });
  };

  const handleAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved('');

    startTransition(async () => {
      const res = await saveBankAccountAction({
        ...accountForm,
        id: editingId ?? undefined,
        sort_order: Number(accountForm.sort_order ?? 0),
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setAccounts((current) => {
        const withoutCurrent = current.filter((account) => account.id !== res.data.id);
        return [...withoutCurrent, res.data].sort((a, b) => {
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.created_at.localeCompare(b.created_at);
        });
      });
      resetAccountForm();
      setSaved('تم حفظ الحساب البنكي بنجاح.');
    });
  };

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setAccountForm({
      id: account.id,
      bank_name: account.bank_name,
      account_holder_name: account.account_holder_name,
      iban: account.iban,
      qr_url: account.qr_url ?? '',
      sort_order: account.sort_order,
      is_active: account.is_active,
    });
    setError('');
    setSaved('');
  };

  const handleDelete = (account: BankAccount) => {
    if (!window.confirm(`حذف حساب ${account.bank_name}؟`)) return;
    setError('');
    setSaved('');

    startTransition(async () => {
      const res = await deleteBankAccountAction(account.id);
      if (!res.success) {
        setError(res.error);
        return;
      }

      setAccounts((current) => current.filter((item) => item.id !== res.data.id));
      if (editingId === res.data.id) resetAccountForm();
      setSaved('تم حذف الحساب البنكي.');
    });
  };

  return (
    <section className="admin-panel space-y-5 p-5">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-[var(--cms-primary)]" />
        <div>
          <h2 className="text-lg font-semibold text-slate-800">بيانات الدفع والتحويل البنكي</h2>
          <p className="text-xs text-slate-500">
            أضف أكثر من حساب بنكي ليظهر للعميل عند اختيار التحويل البنكي.
          </p>
        </div>
      </div>

      <form onSubmit={handleWhatsappSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className={labelClass} htmlFor="bank-whatsapp">
          رقم واتساب استقبال إيصالات التحويل
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="bank-whatsapp"
            className={inputClass}
            value={whatsappNumber}
            onChange={(event) => setWhatsappNumber(event.target.value)}
            dir="ltr"
            placeholder="966503520446"
          />
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ واتساب
          </button>
        </div>
      </form>

      <form onSubmit={handleAccountSubmit} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">
            {editingId ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetAccountForm}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="bank-name">
              اسم البنك
            </label>
            <input
              id="bank-name"
              className={inputClass}
              value={accountForm.bank_name}
              onChange={(event) => setAccountForm({ ...accountForm, bank_name: event.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bank-holder">
              اسم صاحب الحساب
            </label>
            <input
              id="bank-holder"
              className={inputClass}
              value={accountForm.account_holder_name}
              onChange={(event) =>
                setAccountForm({ ...accountForm, account_holder_name: event.target.value })
              }
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bank-iban">
              رقم الآيبان / الحساب
            </label>
            <input
              id="bank-iban"
              className={inputClass}
              value={accountForm.iban}
              onChange={(event) => setAccountForm({ ...accountForm, iban: event.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bank-qr">
              رابط QR / باركود التحويل
            </label>
            <input
              id="bank-qr"
              className={inputClass}
              value={accountForm.qr_url ?? ''}
              onChange={(event) => setAccountForm({ ...accountForm, qr_url: event.target.value })}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="bank-sort">
              ترتيب الظهور
            </label>
            <input
              id="bank-sort"
              type="number"
              className={inputClass}
              value={accountForm.sort_order ?? 0}
              onChange={(event) =>
                setAccountForm({ ...accountForm, sort_order: Number(event.target.value) })
              }
              dir="ltr"
            />
          </div>
          <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={accountForm.is_active ?? true}
              onChange={(event) => setAccountForm({ ...accountForm, is_active: event.target.checked })}
              className="h-4 w-4"
            />
            الحساب نشط ويظهر للعميل
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'حفظ التعديل' : 'إضافة الحساب'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">{saved}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-slate-500">
            <tr>
              <th className="px-3 py-2 text-start">البنك</th>
              <th className="px-3 py-2 text-start">صاحب الحساب</th>
              <th className="px-3 py-2 text-start">الآيبان</th>
              <th className="px-3 py-2 text-start">الحالة</th>
              <th className="px-3 py-2 text-end">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {accounts.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-slate-500" colSpan={5}>
                  لا توجد حسابات بنكية بعد.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{account.bank_name}</td>
                  <td className="px-3 py-2 text-slate-600">{account.account_holder_name}</td>
                  <td className="px-3 py-2 text-slate-600" dir="ltr">
                    {account.iban}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        account.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {account.is_active ? 'نشط' : 'مخفي'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(account)}
                        className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(account)}
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
