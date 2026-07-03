'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  Plane,
  Send,
} from 'lucide-react';
import { submitContactForm } from '@/app/actions/contact';
import type { SiteSettings } from '@/types';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY_FORM: FormState = { name: '', email: '', subject: '', message: '' };

const MAX_LENGTHS: Record<keyof FormState, number> = {
  name: 100,
  email: 254,
  subject: 150,
  message: 3000,
};

export function ContactPageClient({ settings }: { settings: SiteSettings }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', _general: '' }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    startTransition(async () => {
      const result = await submitContactForm(form);
      if (result.success) {
        setForm(EMPTY_FORM);
        setSubmitted(true);
        return;
      }

      const fieldErrors: Record<string, string> = {};
      if (result.validationErrors) {
        Object.entries(result.validationErrors).forEach(([key, messages]) => {
          fieldErrors[key] = messages[0];
        });
      } else {
        fieldErrors._general = result.error;
      }
      setErrors(fieldErrors);
    });
  };

  return (
    <main className="animated-bg relative min-h-screen overflow-x-clip px-3 py-5 sm:px-8 sm:py-6 lg:px-10">
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            id="contact-back-link"
            className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold sm:w-fit"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى موقع الحجز
          </Link>

          <div className="flex items-center gap-3">
            {settings.site_logo_url ? (
              <img
                src={settings.site_logo_url}
                alt="شعار دقه الوقت"
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain p-2"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cms-primary)]/12">
                <Plane className="h-5 w-5 text-[var(--cms-primary)]" />
              </div>
            )}
            <div>
              <p className="text-xl font-semibold text-slate-950">دقه الوقت</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="panel-card px-4 py-6 sm:px-8 sm:py-8">
            <span className="section-kicker">تواصل معنا</span>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl sm:text-5xl">كيف يمكننا مساعدتك؟</h1>
            <p className="section-copy mt-4 max-w-xl">
              استخدم هذه الصفحة لطلبات المسارات الخاصة أو الاستفسارات أو أي دعم يحتاج ردًا
              سريعًا من الفريق.
            </p>

            <div className="mt-8 grid gap-6">
              <a
                href={`tel:${settings.contact_phone}`}
                dir="ltr"
                className="flex min-w-0 items-start gap-3 border-b border-black/8 pb-5 hover:text-slate-950"
              >
                <div className="rounded-full bg-[var(--cms-primary)]/10 p-2.5">
                  <Phone className="h-4 w-4 text-[var(--cms-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">الهاتف</p>
                  <p className="mt-2 break-words text-base font-semibold text-slate-950 sm:text-lg">{settings.contact_phone}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600" dir="rtl">
                    الأفضل للتعديلات العاجلة على الرحلات والتنسيق في نفس اليوم.
                  </p>
                </div>
              </a>

              <a
                href={`mailto:${settings.contact_email}`}
                dir="ltr"
                className="flex min-w-0 items-start gap-3 border-b border-black/8 pb-5 hover:text-slate-950"
              >
                <div className="rounded-full bg-[var(--cms-secondary)]/14 p-2.5">
                  <Mail className="h-4 w-4 text-[var(--cms-secondary)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                    البريد الإلكتروني
                  </p>
                  <p className="mt-2 break-words text-base font-semibold text-slate-950 sm:text-lg">{settings.contact_email}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600" dir="rtl">
                    مناسب للطلبات التفصيلية وخطط الرحلات والاحتياجات الخاصة بالخدمة.
                  </p>
                </div>
              </a>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                ماذا تتوقع بعد الإرسال
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                تُرسل رسالتك بصيغة منظمة تساعد الفريق على المراجعة والرد بشكل أسرع ومن دون
                مراسلات إضافية غير ضرورية.
              </p>
            </div>
          </section>

          <section className="glass overflow-hidden rounded-[20px] glow">
            <div className="border-b border-slate-200 px-4 py-5 sm:px-8 sm:py-6">
              <p className="text-sm font-medium text-slate-500">نموذج التواصل</p>
              <h2 className="mt-1 text-3xl font-semibold text-slate-950">أخبرنا بما تحتاجه</h2>
            </div>

            <div className="p-4 sm:p-8">
              {submitted ? (
                <div className="mx-auto max-w-xl text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/14">
                    <CheckCircle className="h-9 w-9 text-emerald-500" />
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold text-slate-950 sm:text-4xl">تم إرسال الرسالة</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    شكرًا لك. استلم الفريق طلبك وسيقوم بالمتابعة عبر بيانات التواصل التي أدخلتها.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      id="contact-send-another-btn"
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="btn-primary inline-flex px-6 py-4 text-sm font-semibold"
                    >
                      <Send className="h-4 w-4" />
                      إرسال رسالة أخرى
                    </button>
                    <Link href="/" className="btn-secondary inline-flex px-6 py-4 text-sm font-semibold">
                      العودة للرئيسية
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {errors._general && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-500">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {errors._general}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-slate-700">
                        الاسم الكامل
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        maxLength={MAX_LENGTHS.name}
                        placeholder="الاسم الكامل"
                        value={form.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        className="input-shell text-sm"
                      />
                      {errors.name && <p className="mt-2 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-slate-700">
                        البريد الإلكتروني
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        dir="ltr"
                        maxLength={MAX_LENGTHS.email}
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        className="input-shell text-sm"
                      />
                      {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-slate-700">
                        الموضوع
                      </label>
                      <input
                        id="contact-subject"
                        name="subject"
                        type="text"
                        maxLength={MAX_LENGTHS.subject}
                        placeholder="طلب مسار خاص"
                        value={form.subject}
                        onChange={(event) => updateField('subject', event.target.value)}
                        className="input-shell text-sm"
                      />
                      {errors.subject && <p className="mt-2 text-xs text-red-500">{errors.subject}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-slate-700">
                        الرسالة
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        maxLength={MAX_LENGTHS.message}
                        placeholder="اكتب تفاصيل المسار أو الموعد أو أي متطلبات خاصة."
                        rows={6}
                        value={form.message}
                        onChange={(event) => updateField('message', event.target.value)}
                        className="input-shell text-sm"
                      />
                      {errors.message && <p className="mt-2 text-xs text-red-500">{errors.message}</p>}
                    </div>
                  </div>

                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={isPending}
                    className="btn-primary inline-flex w-full px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        جارٍ الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        إرسال الرسالة
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
