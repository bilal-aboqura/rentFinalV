'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

const STORAGE_KEY = 'at_theme';

type Theme = 'light' | 'dark';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'comfort') return 'dark';
  } catch {
    // ignore
  }
  return 'light';
}

export function ThemeToggle() {
  const { lang } = useLanguage();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted theme after hydration
    setTheme(readStoredTheme());
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === 'ar' ? 'تبديل الوضع الداكن' : 'Toggle dark mode'}
      title={isDark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light mode') : lang === 'ar' ? 'الوضع الداكن' : 'Dark mode'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:border-[var(--cms-primary)] hover:text-[var(--cms-primary)]"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
