import React from 'react';
import BookingWizard from '@/components/booking-wizard';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-500/20">
              RF
            </div>
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
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-4 relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.25),rgba(255,255,255,0))]">
        <div className="w-full max-w-4xl text-center mb-12 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            New Feature: Live Route Pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
            Reliable Rides, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Flat-Rate Pricing</span>
          </h1>
          <p className="max-w-xl mx-auto text-slate-400 text-base sm:text-lg">
            Say goodbye to surge fares. Book professional airport transfers and driver services for a transparent flat fee.
          </p>
        </div>

        {/* Live Calculator Component */}
        <div className="w-full relative z-10">
          <BookingWizard />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 RentFinal Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
