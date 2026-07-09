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
  getLanguageDirection,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  resolveLanguage,
  dictionary,
  type Language,
} from "./dictionaries";

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
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return resolveLanguage(stored);
  } catch {
    // localStorage may be unavailable (private mode); ignore.
  }
  return resolveLanguage(document.documentElement.getAttribute("data-lang"));
}

function persistLanguage(next: Language) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  } catch {
    // ignore storage failures
  }
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored !== lang) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads persisted language after hydration (localStorage is unavailable during SSR)
      setLangState(stored);
      return;
    }
    persistLanguage(lang);
  }, [lang]);

  // Keep <html lang/dir> in sync with the active language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const dir = getLanguageDirection(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    persistLanguage(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === "ar" ? "en" : "ar";
      persistLanguage(next);
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
      dir: getLanguageDirection(lang),
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
