import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Cairo, Poppins } from "next/font/google";
import { getSiteSettings } from "@/app/actions/cms";
import {
  getLanguageDirection,
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  resolveLanguage,
} from "@/lib/i18n/dictionaries";
import "./globals.css";

export const dynamic = "force-dynamic";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "حجز النقل من وإلى المطار | Airport Transfer Booking",
  description:
    "احجز خدمة نقل احترافية من وإلى المطار بأسعار واضحة. Book a professional airport transfer with clear pricing.",
};

type RootStyle = CSSProperties & {
  "--cms-primary": string;
  "--cms-secondary": string;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = resolveLanguage(
    cookieStore.get(LANGUAGE_COOKIE_KEY)?.value,
  );
  const settings = await getSiteSettings();
  const rootStyle: RootStyle = {
    "--cms-primary": settings.brand_primary_color,
    "--cms-secondary": settings.brand_secondary_color,
  };
  const noFlashScript = `
(function(){try{var l=localStorage.getItem('${LANGUAGE_STORAGE_KEY}');if(l!=='ar'&&l!=='en'){l='${initialLanguage}';}var d=l==='ar'?'rtl':'ltr';document.documentElement.lang=l;document.documentElement.dir=d;document.documentElement.setAttribute('data-lang',l);document.cookie='${LANGUAGE_COOKIE_KEY}='+l+'; path=/; max-age=31536000; samesite=lax';}catch(e){}try{var t=localStorage.getItem('at_theme');document.documentElement.setAttribute('data-theme',(t==='dark'||t==='comfort')?'dark':'light');}catch(e){}})();
`;

  return (
    <html
      lang={initialLanguage}
      dir={getLanguageDirection(initialLanguage)}
      data-lang={initialLanguage}
      className={`${cairo.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body
        className="flex min-h-full flex-col overflow-x-hidden bg-[var(--cms-bg)] text-slate-950"
        style={rootStyle}
      >
        {children}
      </body>
    </html>
  );
}
