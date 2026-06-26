import React from 'react';
import BookingWizard from '@/components/booking-wizard';
import { getSiteSettings } from '@/app/actions/cms';

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.site_logo_url ? (
              <img
                src={settings.site_logo_url}
                alt="Logo"
                className="h-8 max-w-[120px] object-contain"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-lg"
                style={{ backgroundColor: settings.brand_primary_color }}
              >
                RF
              </div>
            )}
            <span className="font-bold text-white tracking-wide">RentFinal</span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/admin/pricing" className="text-slate-400 hover:text-white transition-colors">
              Admin Dashboard
            </a>
          </nav>
        </div>
      </header>

      {/* Main Hero & Calculator Area */}
      <main
        className="flex-1 flex flex-col justify-center items-center py-16 px-4 relative overflow-hidden bg-cover bg-center"
        style={
          settings.hero_image_url
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url(${settings.hero_image_url})`,
              }
            : {
                backgroundImage: `radial-gradient(ellipse 80%_80% at 50% -20%, rgba(30,58,138,0.25), rgba(255,255,255,0))`,
              }
        }
      >
        <div className="w-full max-w-4xl text-center mb-12 relative z-10 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `${settings.brand_primary_color === 'Maroon' ? '#800000' : settings.brand_primary_color}1a`,
              border: `1px solid ${settings.brand_primary_color === 'Maroon' ? '#800000' : settings.brand_primary_color}33`,
              color: settings.brand_primary_color === 'Maroon' ? '#e11d48' : settings.brand_primary_color,
            }}
          >
            Live Route Pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
            {settings.hero_title}
          </h1>
          <p className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg">
            {settings.about_text}
          </p>
        </div>

        {/* Live Calculator Component */}
        <div className="w-full relative z-10">
          <BookingWizard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-3">
        <p>© 2026 RentFinal Inc. All rights reserved.</p>
        <div className="flex items-center justify-center gap-6 text-slate-400">
          <span>Phone: <a href={`tel:${settings.contact_phone}`} className="hover:text-white transition-colors">{settings.contact_phone}</a></span>
          <span>Email: <a href={`mailto:${settings.contact_email}`} className="hover:text-white transition-colors">{settings.contact_email}</a></span>
        </div>
      </footer>
    </div>
  );
}
