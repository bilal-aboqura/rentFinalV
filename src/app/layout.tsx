import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { getSiteSettings } from "@/app/actions/cms";
import "./globals.css";

export const dynamic = "force-dynamic";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "حجز النقل من وإلى المطار | Airport Transfer Booking",
  description:
    "احجز خدمة نقل احترافية من وإلى المطار بأسعار واضحة. Book a professional airport transfer with clear pricing.",
};

// Runs before paint to apply the saved language direction and theme to avoid
// a RTL/LTR or light/dark flash on first load.
const noFlashScript = `
(function(){try{var l=localStorage.getItem('at_lang');if(l!=='en'){l='ar';}var d=l==='ar'?'rtl':'ltr';document.documentElement.lang=l;document.documentElement.dir=d;document.documentElement.setAttribute('data-lang',l);}catch(e){}try{var t=localStorage.getItem('at_theme');document.documentElement.setAttribute('data-theme',(t==='dark'||t==='comfort')?'dark':'light');}catch(e){}})();
`;

type RootStyle = CSSProperties & {
  "--cms-primary": string;
  "--cms-secondary": string;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getSiteSettings();
  const rootStyle: RootStyle = {
    "--cms-primary": settings.brand_primary_color,
    "--cms-secondary": settings.brand_secondary_color,
  };

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
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
