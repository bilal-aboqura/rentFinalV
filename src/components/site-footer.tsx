'use client';

import Link from 'next/link';
import { Mail, Phone, Plane } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const FOOTER_COPY = {
  ar: {
    tagline: 'خدمة نقل مميزة',
    brand: 'دقه الوقت',
    description:
      'رحلات مطار، وتنقلات داخل المدينة، ودعم احترافي للحجز ضمن تجربة بسيطة وأنيقة تناسب العميل من أول زيارة.',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    browse: 'تصفح',
    book: 'احجز رحلتك',
    experience: 'مميزات الخدمة',
    contact: 'تواصل معنا',
    admin: 'دخول الإدارة',
    rights: 'جميع الحقوق محفوظة.',
    developedBy: 'تم التطوير بواسطة',
  },
  en: {
    tagline: 'Premium transfer service',
    brand: 'Daqat Alwaqt',
    description:
      'Airport transfers, city rides, and professional booking support in a simple, elegant experience from the first visit.',
    phone: 'Phone',
    email: 'Email',
    browse: 'Browse',
    book: 'Book Your Trip',
    experience: 'Service Features',
    contact: 'Contact Us',
    admin: 'Admin Login',
    rights: 'All rights reserved.',
    developedBy: 'Developed by',
  },
} as const;

export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { lang } = useLanguage();
  const copy = FOOTER_COPY[lang];

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      <div className="h-px w-full bg-gradient-to-l from-transparent via-[var(--cms-primary)]/60 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--cms-primary)]/12 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[var(--cms-secondary)]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              {settings.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={copy.brand}
                  className="h-12 w-12 rounded-2xl border border-white/10 bg-white object-contain p-2 shadow-lg shadow-black/30"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cms-primary)]/16 ring-1 ring-white/10">
                  <Plane className="h-5 w-5 text-[var(--cms-primary)]" />
                </div>
              )}
              <div>
                <p className="text-[0.68rem] font-bold tracking-[0.24em] text-[var(--cms-primary)]">
                  {copy.tagline}
                </p>
                <h2 className="text-2xl font-semibold text-white">{copy.brand}</h2>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">{copy.description}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-[var(--cms-primary)]/40 hover:bg-white/[0.06]"
              dir="ltr"
            >
              <div className="mt-0.5 rounded-lg bg-[var(--cms-primary)]/14 p-2">
                <Phone className="h-4 w-4 text-[var(--cms-primary)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-slate-500">
                  {copy.phone}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {settings.contact_phone}
                </p>
              </div>
            </a>
            <a
              href={`mailto:${settings.contact_email}`}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-4 hover:border-[var(--cms-secondary)]/40 hover:bg-white/[0.06]"
              dir="ltr"
            >
              <div className="mt-0.5 rounded-lg bg-[var(--cms-secondary)]/16 p-2">
                <Mail className="h-4 w-4 text-[var(--cms-secondary)]" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-slate-500">
                  {copy.email}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {settings.contact_email}
                </p>
              </div>
            </a>
          </div>

          <div className="flex flex-col gap-3.5 text-sm">
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-slate-500">
              {copy.browse}
            </p>
            <a href="#booking" className="w-fit text-slate-300 hover:text-white">
              {copy.book}
            </a>
            <a href="#experience" className="w-fit text-slate-300 hover:text-white">
              {copy.experience}
            </a>
            <Link href="/contact" className="w-fit text-slate-300 hover:text-white">
              {copy.contact}
            </Link>
            <Link href="/admin/login" className="w-fit text-slate-500 hover:text-slate-300">
              {copy.admin}
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {copy.brand}. {copy.rights}
          </p>
          <p className="text-slate-600">
            {copy.developedBy}{' '}
            <a
              href="https://bilalaboqura.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              Bilal Aboqura
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
