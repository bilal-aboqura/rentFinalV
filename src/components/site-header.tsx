'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Phone, Plane, X } from 'lucide-react';
import type { SiteSettings } from '@/types';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '#booking',     labelKey: 'nav.book' },
  { href: '#prices',      labelKey: 'nav.fleet' },
  { href: '#experience',  labelKey: 'nav.experience' },
  { href: '#how-it-works', labelKey: 'nav.howItWorks' },
];

export default function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 overflow-hidden border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* ─── Top bar ─────────────────────────────────── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-3.5">

        {/* Brand */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {settings.site_logo_url ? (
            <img
              src={settings.site_logo_url}
              alt="Logo"
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white object-contain p-1.5 sm:h-10 sm:w-10 sm:p-2"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary)]/12 sm:h-10 sm:w-10">
              <Plane className="h-5 w-5 text-[var(--brand-primary)]" />
            </div>
          )}
          <span className="truncate text-base font-semibold text-slate-950 sm:text-lg">
            دقة الوقت
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              {t(item.labelKey)}
            </a>
          ))}
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            {t('nav.contact')}
          </Link>
          <Link
            href="/admin/login"
            className="text-xs font-semibold tracking-[0.2em] text-slate-400 transition-colors hover:text-slate-700"
          >
            {t('nav.dashboard')}
          </Link>
        </nav>

        {/* Desktop actions (lg+) */}
        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <a
            href={`tel:${settings.contact_phone}`}
            id="header-phone-link"
            dir="ltr"
            className="btn-secondary inline-flex shrink-0 px-4 py-2.5 text-sm font-semibold"
          >
            <Phone className="h-4 w-4" />
            {settings.contact_phone}
          </a>
        </div>

        {/* Mobile: compact actions + hamburger */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            aria-label={open ? t('nav.close') : t('nav.open')}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile drawer ───────────────────────────── */}
      {open && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-3 pb-4 pt-2 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                {t(item.labelKey)}
              </a>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              {t('nav.contact')}
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-xs font-semibold tracking-[0.18em] text-slate-400 hover:bg-slate-50"
            >
              {t('nav.dashboard')}
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-slate-100" />

            {/* Language + phone */}
            <div className="flex flex-wrap items-center gap-2 px-1">
              <LanguageSwitcher />
              <a
                href={`tel:${settings.contact_phone}`}
                dir="ltr"
                className="btn-secondary inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
              >
                <Phone className="h-4 w-4" />
                {settings.contact_phone}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
