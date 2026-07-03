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
  title: "حجز النقل من وإلى المطار",
  description:
    "احجز خدمة نقل احترافية من وإلى المطار بأسعار واضحة وتجربة عربية أنيقة وسريعة.",
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
  const settings = await getSiteSettings();
  const rootStyle: RootStyle = {
    "--cms-primary": settings.brand_primary_color,
    "--cms-secondary": settings.brand_secondary_color,
  };

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body
        className="flex min-h-full flex-col overflow-x-hidden bg-[var(--cms-bg)] text-slate-950"
        style={rootStyle}
      >
        {children}
      </body>
    </html>
  );
}
