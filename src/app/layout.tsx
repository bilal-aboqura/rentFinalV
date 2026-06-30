import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteSettings } from "@/app/actions/cms";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airport Transfer & Driver Booking",
  description:
    "Premium flat-rate airport transfers - book your ride in minutes. Reliable, professional drivers for city-to-airport routes.",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100" style={rootStyle}>
        {children}
      </body>
    </html>
  );
}
