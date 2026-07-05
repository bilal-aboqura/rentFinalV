"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  dictionary,
  type Language,
} from "./dictionaries";

const STORAGE_KEY = "at_lang";

type TranslationFunction = (key: string, lang?: Language) => string;

type LanguageContextValue = {
  lang: Language;
  dir: "rtl" | "ltr";
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: TranslationFunction;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with the default (server-rendered) language to avoid hydration
  // mismatches, then sync from localStorage after mount.
  const [lang, setLangState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads persisted language after hydration (localStorage is unavailable during SSR)
    setLangState(readStoredLanguage());
  }, []);

  // Keep <html lang/dir> in sync with the active language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === "ar" ? "en" : "ar";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  const t = useCallback<TranslationFunction>(
    (key, override) => {
      const active = override ?? lang;
      const entry = dictionary[key];
      if (!entry) return key;
      return entry[active];
    },
    [lang],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggleLang,
      t,
    }),
    [lang, setLang, toggleLang, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

/**
 * Server-side translation helper for Server Components / Server Actions
 * where the React context is unavailable. Defaults to Arabic.
 */
export function translate(key: string, lang: Language = DEFAULT_LANGUAGE): string {
  const entry = dictionary[key];
  if (!entry) return key;
  return entry[lang];
}
