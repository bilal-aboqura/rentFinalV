import type { Metadata } from 'next';
import { Plane, Shield, Clock, Star, Phone, MessageCircle } from 'lucide-react';
import BookingForm from '@/components/booking-form';
import { getContentAction } from '@/app/admin/dashboard/actions';

export const metadata: Metadata = {
  title: 'Airport Transfer & Driver Booking | Book Your Ride',
  description:
    'Premium flat-rate airport transfers. Book your ride in minutes — reliable drivers, fixed prices, no surprises.',
};

const FEATURES = [
  { icon: Plane, title: 'All Airports', desc: 'Coverage for all major airports and city centers.' },
  { icon: Shield, title: 'Fixed Prices', desc: 'Flat-rate pricing — no surge, no surprises.' },
  { icon: Clock, title: '24/7 Service', desc: 'Available around the clock, every day of the year.' },
  { icon: Star, title: 'Professional Drivers', desc: 'Vetted, experienced chauffeurs only.' },
];

export default async function CustomerPage() {
  const contentRes = await getContentAction();
  const content = contentRes.success ? contentRes.data : [];

  const getContent = (key: string, fallback: string) =>
    content.find((c) => c.key === key)?.value ?? fallback;

  const heroTitle = getContent('hero_title', 'Premium Airport Transfers');
  const heroSubtitle = getContent('hero_subtitle', 'Reliable, flat-rate rides to and from the airport — book in minutes.');

  // Get FAQ entries
  const faqs = [1, 2, 3].map((n) => ({
    q: getContent(`faq_${n}_question`, ''),
    a: getContent(`faq_${n}_answer`, ''),
  })).filter((faq) => faq.q);

  return (
    <main className="min-h-screen animated-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">AirTransfer</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#booking" className="text-slate-400 hover:text-white text-sm transition-colors">Book a Ride</a>
            <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How It Works</a>
            <a href="#faq" className="text-slate-400 hover:text-white text-sm transition-colors">FAQ</a>
            <a href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">Contact</a>
            <a href="/admin/login" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Admin</a>
          </nav>
          <a
            href="tel:+1234567890"
            id="header-phone-link"
            className="hidden md:flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 px-4 py-2 rounded-lg text-sm transition-all"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Now Available — 24/7 Service
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              {heroTitle.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="gradient-text">
                {heroTitle.split(' ').slice(-1)}
              </span>
            </h1>

            <p className="text-xl text-slate-400 leading-relaxed max-w-lg">
              {heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                id="hero-book-now-btn"
                href="#booking"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/30"
              >
                Book Now <Plane className="w-4 h-4" />
              </a>
              <a
                id="hero-contact-btn"
                href="/contact"
                className="glass border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Us
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>✓ No hidden fees</span>
              <span>✓ Instant confirmation</span>
              <span>✓ Free cancellation</span>
            </div>
          </div>

          {/* Booking Form */}
          <div id="booking" className="w-full">
            <BookingForm />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose AirTransfer?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We make airport transfers simple, predictable, and stress-free.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="glass rounded-2xl p-6 space-y-4 hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-600/30 transition-all">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" className="py-20 px-6 bg-slate-900/40">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="glass rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-3">{faq.q}</h3>
                  <p className="text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="glass border-t border-white/10 py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Plane className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-400 text-sm">AirTransfer © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="/contact" className="hover:text-slate-300 transition-colors">Contact</a>
            <a href="/admin/login" className="hover:text-slate-300 transition-colors">Admin Login</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
