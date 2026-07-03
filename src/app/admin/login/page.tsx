'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertCircle, Lock, Loader2, Mail, Plane, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminLoginAction } from '@/app/admin/dashboard/actions';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await adminLoginAction(email, password);
      if (result.success) {
        router.push(result.data.redirect);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  };

  return (
    <main className="animated-bg relative min-h-screen overflow-x-clip px-3 py-6 sm:px-8 sm:py-10 lg:px-10">
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <section className="panel-card px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cms-primary)]/12">
              <Plane className="h-5 w-5 text-[var(--cms-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">دخول الإدارة</h1>
            </div>
          </div>

          <p className="section-copy mt-5 max-w-xl">
            ادخل إلى لوحة التحكم لإدارة الحجوزات والأسعار والسائقين والمواقع والمحتوى من مكان
            واحد منظم وواضح.
          </p>

          <div className="mt-8 grid gap-6">
            <div className="border-b border-black/8 pb-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-[var(--cms-primary)]/10 p-2.5">
                  <Shield className="h-4 w-4 text-[var(--cms-primary)]" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">وصول آمن</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    استخدم بيانات الإدارة للوصول إلى النظام من دون تعريض بيانات الحجز العامة
                    للخطر.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                داخل لوحة التحكم
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                إدارة الحجوزات، ورسائل العملاء، وإعداد المسارات، والتحكم بالأسعار، وتحديث
                المحتوى كلها ضمن نفس الواجهة.
              </p>
            </div>
          </div>

          <Link href="/" className="btn-secondary mt-8 inline-flex w-full px-4 py-3 text-sm font-semibold sm:w-fit">
            العودة إلى موقع الحجز
          </Link>
        </section>

        <section className="glass overflow-hidden rounded-[20px] glow">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-8 sm:py-6">
            <p className="text-sm font-medium text-slate-500">تسجيل الدخول</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
              المتابعة إلى لوحة التحكم
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-500">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--cms-primary)]" />
                  البريد الإلكتروني
                </span>
              </label>
              <input
                id="admin-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-shell text-sm"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--cms-primary)]" />
                  كلمة المرور
                </span>
              </label>
              <input
                id="admin-password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                required
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-shell text-sm"
              />
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isPending}
              className="btn-primary inline-flex w-full px-6 py-4 text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  دخول
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
