'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Luggage,
  MessageCircle,
  Phone,
  Plane,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import BookingForm from '@/components/booking-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import Reveal, { useReveal } from '@/components/reveal';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { PublicFleetCar, SiteSettings } from '@/types';

type BrandStyle = CSSProperties & {
  '--brand-primary': string;
  '--brand-secondary': string;
};

const COPY = {
  ar: {
    heroTitle: 'خدمة نقل موثوقة من وإلى المطار',
    heroSubtitle:
      'احجز رحلتك خلال دقائق، اختر السيارة المناسبة، واعرف السعر قبل تأكيد الطلب.',
    startBooking: 'ابدأ الحجز',
    talkToUs: 'تحدث مع الفريق',
    liveSupport: 'دعم مباشر',
    supportLine: 'للدعم المباشر والاستفسارات السريعة',
    facts: [
      ['3', 'خطوات واضحة لإرسال الطلب'],
      ['24/7', 'متابعة وتشغيل مستمر'],
      ['واضح', 'تسعير مباشر حسب المسار والسيارة'],
    ],
    bookingEyebrow: 'ابدأ الحجز',
    bookingTitle: 'رحلة واضحة من أول خطوة',
    fleetEyebrow: 'الأسطول',
    fleetTitle: 'السيارات المتاحة للحجز.',
    fleetText:
      'هذه السيارات تأتي من نفس جدول الأسطول المستخدم داخل الحجز، وأسعارها مرتبطة بقواعد التسعير بين نقطة الانطلاق والوصول.',
    ready: 'جاهزة للحجز',
    passengers: 'راكب',
    luggage: 'حقائب',
    fromPrice: 'ابتداء من',
    pricePending: 'حسب المسار',
    sar: 'ريال',
    noFleet: 'لم تتم إضافة سيارات نشطة للأسطول بعد.',
    whyEyebrow: 'لماذا نحن',
    whyTitle: 'تجربة نقل واضحة من أول سعر إلى لحظة الوصول.',
    whyText:
      'ركزنا التجربة على ما يحتاجه المسافر بسرعة: سعر مفهوم، تواصل سهل، وخدمة منظمة تمنح انطباعا مطمئنا قبل تأكيد الطلب.',
    howEyebrow: 'كيف تعمل الخدمة',
    howTitle: 'احجز رحلتك في ثلاث خطوات واضحة.',
    howText:
      'مسار الحجز يعرض السعر والاختيارات في وقتها، ثم يترك لك طريقة تواصل مباشرة إذا كان الطلب يحتاج تنسيقا خاصا.',
    customTitle: 'هل تحتاج مسارا خاصا؟',
    customText:
      'يمكن لفريقنا تجهيز عروض مخصصة وتنسيق الاستقبال أو الفنادق حسب تفاصيل الرحلة.',
    openContact: 'افتح نموذج التواصل',
    features: [
      ['أسعار واضحة قبل التأكيد', 'نعرض سعر الرحلة بوضوح حتى يفهم العميل التكلفة مباشرة.'],
      ['دعم سريع طوال الوقت', 'فريق المتابعة جاهز لتنسيق الحجوزات والتعديلات.'],
      ['خدمة احترافية راقية', 'تجربة منظمة وأنيقة تمنح العميل ثقة وراحة.'],
      ['تغطية للمطار والمدينة', 'من الاستقبال في المطار إلى التوصيل للفندق أو المدينة.'],
    ],
    steps: [
      ['01', 'حدد المسار', 'اختر نقطة الانطلاق والوجهة ووقت الرحلة بما يناسب جدول المسافر.'],
      ['02', 'اختر السيارة المناسبة', 'قارن بين السيارات المتاحة مع السعر الواضح حسب المسار.'],
      ['03', 'أرسل الطلب واسترح', 'أدخل بيانات المسافر مرة واحدة واحصل على رقم مرجعي ثم نتابع التأكيد.'],
    ],
  },
  en: {
    heroTitle: 'Reliable airport transfers, booked in minutes',
    heroSubtitle:
      'Choose your route, select the right vehicle, and see clear pricing before submitting your request.',
    startBooking: 'Start Booking',
    talkToUs: 'Talk to Us',
    liveSupport: 'Live Support',
    supportLine: 'Fast support for booking questions and trip coordination',
    facts: [
      ['3', 'Clear steps to submit your request'],
      ['24/7', 'Continuous booking follow-up'],
      ['Clear', 'Route and vehicle-based pricing'],
    ],
    bookingEyebrow: 'Start Booking',
    bookingTitle: 'A clear trip from the first step',
    fleetEyebrow: 'Fleet',
    fleetTitle: 'Vehicles available for booking.',
    fleetText:
      'These vehicles come from the same fleet table used in booking, with prices connected to route pricing rules between pickup and drop-off.',
    ready: 'Ready to book',
    passengers: 'passengers',
    luggage: 'bags',
    fromPrice: 'From',
    pricePending: 'Route based',
    sar: 'SAR',
    noFleet: 'No active fleet vehicles have been added yet.',
    whyEyebrow: 'Why Us',
    whyTitle: 'A clear transfer experience from first price to arrival.',
    whyText:
      'The experience focuses on what travelers need quickly: understandable prices, easy communication, and organized service before confirmation.',
    howEyebrow: 'How It Works',
    howTitle: 'Book your trip in three clear steps.',
    howText:
      'The booking path shows price and options at the right time, then gives you a direct contact path for special coordination.',
    customTitle: 'Need a custom route?',
    customText:
      'Our team can prepare custom offers and coordinate airport reception, hotels, or special trip details.',
    openContact: 'Open Contact Form',
    features: [
      ['Clear prices before confirmation', 'Trip pricing is shown clearly so the customer understands the cost.'],
      ['Fast support around the clock', 'Our team is ready to coordinate bookings, updates, and traveler help.'],
      ['Professional premium service', 'A calm, organized experience designed to feel reliable and comfortable.'],
      ['Airport and city coverage', 'From airport pickup to hotel, address, or city drop-off.'],
    ],
    steps: [
      ['01', 'Set the route', 'Choose pickup, destination, and trip time around the traveler schedule.'],
      ['02', 'Select the right vehicle', 'Compare available vehicles with clear route-based pricing.'],
      ['03', 'Submit and relax', 'Enter passenger details once, get a reference number, and we handle confirmation.'],
    ],
  },
} as const;

type LucideIcon = typeof Plane;

function FleetCard({
  car,
  index,
  lang,
  copy,
  priceFormatter,
}: {
  car: PublicFleetCar;
  index: number;
  lang: 'ar' | 'en';
  copy: (typeof COPY)[keyof typeof COPY];
  priceFormatter: Intl.NumberFormat;
}) {
  const reveal = useReveal<HTMLDivElement>({ animation: 'up', delay: index * 90 });
  return (
    <article
      ref={reveal.ref}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/92 p-2.5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_64px_rgba(15,23,42,0.16)] sm:rounded-[30px] sm:p-3 ${reveal.className}`}
      style={reveal.style}
    >
      <div className="relative h-[210px] overflow-hidden rounded-xl sm:h-[240px] sm:rounded-[24px]">
        {car.image_url ? (
          <img
            src={car.image_url}
            alt={lang === 'ar' ? car.name_ar : car.name}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.08]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--brand-primary)_14%,white),color-mix(in_srgb,var(--brand-secondary)_20%,white))]">
            <Plane className="h-10 w-10 text-[var(--brand-primary)] transition-transform duration-500 group-hover:scale-110" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/38 via-slate-950/6 to-transparent" />
        <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/85 px-3 py-1 text-[0.7rem] font-semibold text-slate-700 backdrop-blur">
          {copy.ready}
        </div>
      </div>

      <div className="px-1 pb-1 pt-5">
        <h3 className="break-words text-xl font-semibold text-slate-950 sm:text-2xl">
          {lang === 'ar' ? car.name_ar : car.name}
        </h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <Users className="h-3.5 w-3.5" />
            {car.passenger_capacity} {copy.passengers}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <Luggage className="h-3.5 w-3.5" />
            {car.luggage_capacity} {copy.luggage}
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">{copy.fromPrice}</p>
          <div className="text-end">
            {car.starting_price === null ? (
              <p className="text-sm font-bold text-slate-700">{copy.pricePending}</p>
            ) : (
              <p className="text-2xl font-bold text-slate-950">
                {priceFormatter.format(car.starting_price)}
                <span className="ms-1 text-xs font-semibold text-slate-500">{copy.sar}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function FeatureCard({
  title,
  desc,
  Icon,
  index,
}: {
  title: string;
  desc: string;
  Icon: LucideIcon;
  index: number;
}) {
  const reveal = useReveal<HTMLDivElement>({ animation: 'up', delay: index * 100 });
  return (
    <article
      ref={reveal.ref}
      className={`rounded-lg border border-black/10 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] ${reveal.className}`}
      style={reveal.style}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10 transition-colors duration-300 group-hover:bg-[var(--brand-primary)]/16">
          <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
        </div>
        <span className="text-xs font-bold text-slate-300" dir="ltr">
          0{index + 1}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950 sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>
    </article>
  );
}

function StepCard({
  step,
  title,
  desc,
  index,
  isLast,
}: {
  step: string;
  title: string;
  desc: string;
  index: number;
  isLast: boolean;
}) {
  const reveal = useReveal<HTMLDivElement>({ animation: 'start', delay: index * 120 });
  return (
    <article
      ref={reveal.ref}
      className={`grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07] sm:grid-cols-[4rem_1fr] sm:p-5 ${reveal.className}`}
      style={reveal.style}
    >
      <div className="flex items-center gap-3 sm:block">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950 transition-transform duration-300 hover:scale-105 sm:h-14 sm:w-14 sm:text-lg">
          {step}
        </div>
        {!isLast && <div className="hidden h-10 w-px bg-white/16 sm:mx-7 sm:mt-3 sm:block" />}
      </div>
      <div>
        <h3 className="text-lg font-semibold sm:text-2xl">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-300">{desc}</p>
      </div>
    </article>
  );
}

export default function CustomerHome({
  settings,
  fleetCars,
}: {
  settings: SiteSettings;
  fleetCars: PublicFleetCar[];
}) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang];
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const priceFormatter = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 2,
  });

  const brandStyle: BrandStyle = {
    '--brand-primary': settings.brand_primary_color,
    '--brand-secondary': settings.brand_secondary_color,
  };

  const heroBackgroundStyle: CSSProperties = settings.hero_image_url
    ? {
        backgroundImage: `
          linear-gradient(270deg, var(--hero-gradient-start), var(--hero-gradient-mid), var(--hero-gradient-end)),
          url(${settings.hero_image_url})
        `,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {
        backgroundImage:
          'radial-gradient(circle at 15% 20%, rgba(184,134,47,.18), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      };

  return (
    <main className="relative min-h-screen bg-slate-100 text-slate-950 lg:bg-white" style={brandStyle}>
      <SiteHeader settings={settings} />

      <section
        className="relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 lg:py-28"
        style={heroBackgroundStyle}
      >
        <div className="relative z-10 mx-auto grid max-w-[90rem] gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(30rem,38rem)] lg:items-center lg:gap-16">
          <div className="space-y-7 text-center lg:text-start">
            <div className="space-y-4">
              <p className="at-rise mx-auto w-fit rounded-full border border-[var(--brand-primary)]/20 bg-white/70 px-4 py-2 text-xs font-bold tracking-[0.22em] text-[var(--brand-primary)] shadow-sm backdrop-blur lg:mx-0" style={{ animationDelay: '0ms' }}>
                AIRPORT TRANSFER
              </p>
              <h1 className="at-rise mx-auto max-w-5xl text-[clamp(2.4rem,9vw,6.2rem)] font-semibold leading-[1.08] text-slate-950 lg:mx-0" style={{ animationDelay: '90ms' }}>
                {lang === 'ar' ? settings.hero_title || copy.heroTitle : copy.heroTitle}
              </h1>
              <p className="at-rise mx-auto max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-[1.05rem] sm:leading-8 lg:mx-0" style={{ animationDelay: '180ms' }}>
                {lang === 'ar' ? settings.about_text || copy.heroSubtitle : copy.heroSubtitle}
              </p>
            </div>

            <div className="at-rise flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ animationDelay: '270ms' }}>
              <a
                id="hero-book-now-btn"
                href="#booking"
                className="btn-primary inline-flex w-full max-w-[17.5rem] px-5 py-3.5 text-sm font-semibold transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:w-auto sm:max-w-none sm:px-7 sm:py-4"
              >
                {copy.startBooking}
                <Clock className="h-4 w-4" />
                <ArrowIcon className="h-4 w-4" />
              </a>
              <Link
                id="hero-contact-btn"
                href="/contact"
                className="inline-flex w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-md active:scale-95 sm:w-auto sm:max-w-none sm:px-7 sm:py-4"
              >
                <MessageCircle className="h-4 w-4" />
                {copy.talkToUs}
              </Link>
            </div>

            <div className="at-rise hidden space-y-5 border-t border-slate-200 pt-6 lg:block" style={{ animationDelay: '380ms' }}>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-[var(--brand-secondary)]" />
                <span>{copy.supportLine}</span>
                <a href={`tel:${settings.contact_phone}`} dir="ltr" className="font-semibold text-slate-950">
                  {settings.contact_phone}
                </a>
              </div>
              <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
                {copy.facts.map(([value, label]) => (
                  <div key={label} className="space-y-2 transition-transform duration-300 hover:-translate-y-0.5 sm:border-r sm:border-slate-200 sm:pr-4">
                    <p className="text-2xl font-semibold text-slate-950">{value}</p>
                    <p className="text-sm leading-6 text-slate-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="booking" className="at-pop relative min-w-0 lg:pt-8" style={{ animationDelay: '150ms' }}>
            <div className="at-glow absolute inset-x-8 top-4 h-28 rounded-full bg-[var(--brand-primary)]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[22px] border border-black/6 bg-white/95 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[34px]">
              <div className="mb-3 rounded-[18px] border border-black/6 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--brand-primary)_5%,white),color-mix(in_srgb,var(--brand-secondary)_10%,white))] px-4 py-4 text-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">{copy.bookingEyebrow}</p>
                    <p className="mt-1 text-lg font-semibold">{copy.bookingTitle}</p>
                  </div>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    dir="ltr"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--brand-primary)]/12 bg-white/90 px-3 py-2 text-xs font-semibold text-[var(--brand-primary)] shadow-sm"
                  >
                    {copy.liveSupport}
                  </a>
                </div>
              </div>
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      <section id="prices" className="relative overflow-hidden px-3 py-14 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--brand-primary)]/6 to-transparent" />
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 max-w-3xl">
            <span className="section-kicker">{copy.fleetEyebrow}</span>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-5xl">{copy.fleetTitle}</h2>
            <p className="section-copy mt-4 max-w-2xl">{copy.fleetText}</p>
          </Reveal>

          {fleetCars.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {copy.noFleet}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {fleetCars.map((car, index) => (
                <FleetCard
                  key={car.id}
                  car={car}
                  index={index}
                  lang={lang}
                  copy={copy}
                  priceFormatter={priceFormatter}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="experience" className="px-3 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 max-w-3xl">
            <span className="section-kicker">{copy.whyEyebrow}</span>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              {copy.whyTitle}
            </h2>
            <p className="section-copy mt-3 max-w-2xl text-sm sm:text-base">{copy.whyText}</p>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.features.map(([title, desc], index) => {
              const icons = [Shield, Clock, Star, Sparkles] as LucideIcon[];
              const Icon = icons[index] ?? Shield;
              return (
                <FeatureCard key={title} title={title} desc={desc} Icon={Icon} index={index} />
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-3 pb-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-7xl rounded-lg bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-12">
            <Reveal animation="up">
              <span className="text-xs font-bold text-[var(--brand-secondary)]">{copy.howEyebrow}</span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-5xl">{copy.howTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">{copy.howText}</p>
            </Reveal>

            <div className="space-y-4">
              {copy.steps.map(([step, title, desc], index) => (
                <StepCard
                  key={step}
                  step={step}
                  title={title}
                  desc={desc}
                  index={index}
                  isLast={index === copy.steps.length - 1}
                />
              ))}

              <Reveal animation="up" delay={120} className="rounded-lg border border-[var(--brand-secondary)]/30 bg-[var(--brand-secondary)]/12 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--brand-secondary)]">{copy.customTitle}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-100 sm:text-base">{copy.customText}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                    <a
                      href={`tel:${settings.contact_phone}`}
                      dir="ltr"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:scale-[1.03]"
                    >
                      <Phone className="h-4 w-4" />
                      {settings.contact_phone}
                    </a>
                    <Link
                      href="/contact"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/16 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-white/8"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {copy.openContact}
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
