import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
