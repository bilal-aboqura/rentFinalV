"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LANGUAGE_LABELS } from "@/lib/i18n/dictionaries";

type Variant = "header" | "ghost";

export function LanguageSwitcher({ variant = "header" }: { variant?: Variant }) {
  const { lang, toggleLang } = useLanguage();
  const target = lang === "ar" ? "en" : "ar";

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={toggleLang}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
        aria-label={`Switch to ${LANGUAGE_LABELS[target]}`}
      >
        <Globe className="h-4 w-4" />
        {LANGUAGE_LABELS[target]}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLang}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[var(--cms-primary)] hover:text-[var(--cms-primary)]"
      aria-label={`Switch to ${LANGUAGE_LABELS[target]}`}
    >
      <Globe className="h-4 w-4" />
      {LANGUAGE_LABELS[target]}
    </button>
  );
}
