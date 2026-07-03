'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Phone, Plane, X } from 'lucide-react';
import type { SiteSettings } from '@/types';

const NAV_ITEMS = [
  { href: '#booking', label: 'الحجز' },
  { href: '#prices', label: 'الأسعار' },
  { href: '#experience', label: 'المميزات' },
  { href: '#how-it-works', label: 'طريقة العمل' },
];

export default function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 overflow-hidden border-b border-slate-200 bg-white/94 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {settings.site_logo_url ? (
            <img
              src={settings.site_logo_url}
              alt="شعار دقه الوقت"
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-contain p-1.5 sm:h-10 sm:w-10 sm:p-2"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/12 sm:h-10 sm:w-10">
              <Plane className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
          )}
          <span className="text-lg font-semibold text-slate-950 sm:text-xl">دقه الوقت</span>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            تواصل معنا
          </Link>
          <Link
            href="/admin/login"
            className="text-xs font-semibold tracking-[0.2em] text-slate-400 hover:text-slate-700"
          >
            الإدارة
          </Link>
        </nav>

        <a
          href={`tel:${settings.contact_phone}`}
          id="header-phone-link"
          dir="ltr"
          className="btn-secondary inline-flex shrink-0 px-3 py-2 text-xs font-semibold sm:px-5 sm:py-3 sm:text-sm"
        >
          <Phone className="h-4 w-4" />
          {settings.contact_phone}
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              تواصل معنا
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-xs font-semibold tracking-[0.18em] text-slate-400 hover:bg-slate-50"
            >
              الإدارة
            </Link>
            <a
              href={`tel:${settings.contact_phone}`}
              dir="ltr"
              className="btn-secondary mt-2 inline-flex items-center justify-center px-4 py-3 text-sm font-semibold md:hidden"
            >
              <Phone className="h-4 w-4" />
              {settings.contact_phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
