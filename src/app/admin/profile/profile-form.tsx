'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { updateAdminProfileAction } from '@/app/admin/dashboard/actions';

export default function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [fullName, setFullName] = useState(initialName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    startTransition(async () => {
      const result = await updateAdminProfileAction({ fullName, password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPassword('');
      setConfirmPassword('');
      setSaved(true);
    });
  };

  const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[var(--cms-primary)] focus:outline-none';
  return (
    <form onSubmit={submit} className="admin-panel space-y-5 p-5">
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="profile-email">البريد الإلكتروني</label>
        <input id="profile-email" value={email} disabled dir="ltr" className={`${fieldClass} cursor-not-allowed bg-slate-100 text-slate-500`} />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="profile-name">الاسم</label>
        <input id="profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} className={fieldClass} />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="profile-password">كلمة المرور الجديدة</label>
        <input id="profile-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} autoComplete="new-password" placeholder="اتركها فارغة للإبقاء على الحالية" className={fieldClass} />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="profile-confirm-password">تأكيد كلمة المرور الجديدة</label>
        <input id="profile-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} autoComplete="new-password" className={fieldClass} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />تم حفظ التغييرات.</p>}
      <button type="submit" disabled={isPending} className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold disabled:opacity-60">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ التغييرات
      </button>
    </form>
  );
}
