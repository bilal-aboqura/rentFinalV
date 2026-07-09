import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { LANGUAGE_COOKIE_KEY, resolveLanguage } from "@/lib/i18n/dictionaries";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const initialLanguage = resolveLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );

  return <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>;
}
