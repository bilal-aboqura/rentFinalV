import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import { Clock, MessageCircle, Phone, Plane, Shield, Star } from 'lucide-react';
import BookingForm from '@/components/booking-form';
import SiteFooter from '@/components/site-footer';
import { getSiteSettings } from '@/app/actions/cms';

export const metadata: Metadata = {
  title: 'Airport Transfer & Driver Booking | Book Your Ride',
  description:
    'Premium flat-rate airport transfers. Book your ride in minutes with reliable drivers and fixed prices.',
};

const FEATURES = [
  { icon: Plane, title: 'All Airports', desc: 'Coverage for major airports and city centers.' },
  { icon: Shield, title: 'Fixed Prices', desc: 'Flat-rate pricing with no surge or surprises.' },
  { icon: Clock, title: '24/7 Service', desc: 'Available around the clock, every day of the year.' },
  { icon: Star, title: 'Professional Drivers', desc: 'Vetted, experienced chauffeurs only.' },
];

type BrandStyle = CSSProperties & {
  '--brand-primary': string;
  '--brand-secondary': string;
};

export default async function CustomerPage() {
  const settings = await getSiteSettings();
  const brandStyle: BrandStyle = {
    '--brand-primary': settings.brand_primary_color,
    '--brand-secondary': settings.brand_secondary_color,
  };
  const heroBackgroundStyle: CSSProperties = settings.hero_image_url
    ? {
        backgroundImage: `linear-gradient(90deg, color-mix(in srgb, ${settings.brand_secondary_color} 92%, transparent), color-mix(in srgb, ${settings.brand_secondary_color} 58%, transparent)), url(${settings.hero_image_url})`,
      }
    : {
        backgroundImage: `linear-gradient(135deg, ${settings.brand_secondary_color}, #171717 55%, #111827)`,
      };

  return (
    <main className="min-h-screen bg-[var(--brand-secondary)] text-white" style={brandStyle}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--brand-secondary)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {settings.site_logo_url ? (
              <img
                src={settings.site_logo_url}
                alt="AirTransfer logo"
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-primary)]">
                <Plane className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-lg font-bold tracking-tight text-white">AirTransfer</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#booking" className="text-sm text-slate-300 hover:text-white">
              Book a Ride
            </a>
            <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white">
              How It Works
            </a>
            <a href="/contact" className="text-sm text-slate-300 hover:text-white">
              Contact
            </a>
            <a href="/admin/login" className="text-xs text-slate-500 hover:text-slate-300">
              Admin
            </a>
          </nav>
          <a
            href={`tel:${settings.contact_phone}`}
            id="header-phone-link"
            className="hidden items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10 md:flex"
          >
            <Phone className="h-4 w-4" />
            Call Us
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden bg-cover bg-center px-6 py-24" style={heroBackgroundStyle}>
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
              Now Available - 24/7 Service
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-tight text-white lg:text-6xl">
              {settings.hero_title}
            </h1>

            <p className="max-w-xl text-xl leading-relaxed text-slate-200">
              {settings.about_text}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                id="hero-book-now-btn"
                href="#booking"
                className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-8 py-4 font-semibold text-white shadow-lg hover:brightness-110"
              >
                Book Now <Plane className="h-4 w-4" />
              </a>
              <a
                id="hero-contact-btn"
                href="/contact"
                className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-8 py-4 font-semibold text-white hover:bg-white/15"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Us
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-300">
              <span>No hidden fees</span>
              <span>Instant confirmation</span>
              <span>Free cancellation</span>
            </div>
          </div>

          <div id="booking" className="w-full">
            <BookingForm />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Why Choose AirTransfer?</h2>
            <p className="mx-auto max-w-xl text-slate-400">
              We make airport transfers simple, predictable, and stress-free.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="space-y-4 rounded-lg border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand-primary)]/20">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
