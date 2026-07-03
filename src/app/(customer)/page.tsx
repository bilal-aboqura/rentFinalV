import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Phone,
  Plane,
  Shield,
  Star,
} from 'lucide-react';
import BookingForm from '@/components/booking-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getHomepagePriceCards, getSiteSettings } from '@/app/actions/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'حجز النقل من وإلى المطار | دقه الوقت',
  description:
    'خدمة نقل مميزة بأسعار واضحة. احجز رحلتك خلال دقائق مع سائقين موثوقين وتجربة عربية حديثة.',
};

const FEATURES = [
  {
    icon: Shield,
    title: 'أسعار واضحة قبل التأكيد',
    desc: 'نعرض سعر الرحلة بوضوح حتى يفهم العميل التكلفة مباشرة من دون مفاجآت.',
  },
  {
    icon: Clock,
    title: 'دعم سريع طوال الوقت',
    desc: 'فريق المتابعة جاهز لتنسيق الحجوزات والتعديلات ومساعدة المسافرين بسهولة.',
  },
  {
    icon: Star,
    title: 'خدمة احترافية راقية',
    desc: 'تجربة منظمة وأناقة في التفاصيل تمنح العميل انطباعًا موثوقًا ومريحًا.',
  },
  {
    icon: Plane,
    title: 'تغطية للمطار والمدينة',
    desc: 'من الاستقبال في المطار إلى التوصيل للفندق أو المدينة، كل شيء يبقى بسيطًا وواضحًا.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'حدد المسار',
    desc: 'اختر نقطة الانطلاق والوجهة ووقت الرحلة بما يناسب جدول المسافر.',
  },
  {
    step: '02',
    title: 'اختر الفئة المناسبة',
    desc: 'قارن بين الفئات المتاحة مع السعر الواضح لاختيار السيارة الأنسب.',
  },
  {
    step: '03',
    title: 'أرسل الطلب واسترح',
    desc: 'أدخل بيانات المسافر مرة واحدة واحصل على رقم مرجعي ثم نتابع نحن التأكيد.',
  },
];

const HERO_FACTS = [
  { value: '3', label: 'خطوات فقط لإرسال الطلب' },
  { value: '24/7', label: 'متابعة وتشغيل مستمر' },
  { value: 'واضح', label: 'تسعير مباشر ومسار مفهوم' },
];

type BrandStyle = CSSProperties & {
  '--brand-primary': string;
  '--brand-secondary': string;
};

export default async function CustomerPage() {
  const [settings, priceCards] = await Promise.all([
    getSiteSettings(),
    getHomepagePriceCards(),
  ]);

  const brandStyle: BrandStyle = {
    '--brand-primary': settings.brand_primary_color,
    '--brand-secondary': settings.brand_secondary_color,
  };

  const heroBackgroundStyle: CSSProperties = settings.hero_image_url
    ? {
        backgroundImage: `
          linear-gradient(270deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.74) 34%, rgba(255, 255, 255, 0.32) 68%, rgba(255, 255, 255, 0.52) 100%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 42%, rgba(255, 255, 255, 0.84) 100%),
          url(${settings.hero_image_url})
        `,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }
    : {
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      };

  const priceFormatter = new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 2,
  });

  return (
    <main className="relative min-h-screen bg-slate-100 text-slate-950 lg:bg-white" style={brandStyle}>
      <SiteHeader settings={settings} />

      <section
        className="relative w-full overflow-hidden bg-cover bg-center px-4 pb-7 pt-8 sm:px-6 sm:py-18 lg:py-28"
        style={heroBackgroundStyle}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.12),transparent_32%)]" />
        <div className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-[var(--brand-secondary)]/16 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-44 w-44 rounded-full bg-[var(--brand-primary)]/16 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-[90rem] gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(30rem,38rem)] lg:items-center lg:gap-16 xl:grid-cols-[minmax(0,1.16fr)_minmax(34rem,42rem)] xl:gap-20">
          <div className="min-w-0 space-y-5 text-center text-slate-950 sm:space-y-10 lg:text-right">
            <div className="space-y-3 sm:space-y-6">
              <h1 className="mx-auto max-w-5xl break-words text-[clamp(2.35rem,11vw,6.3rem)] font-semibold leading-[1.08] text-slate-950 sm:text-[clamp(2.1rem,7vw,6.3rem)] lg:mx-0">
                {settings.hero_title}
              </h1>
              <p className="mx-auto max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-[1.05rem] sm:leading-8 lg:mx-0">
                {settings.about_text}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start">
              <a
                id="hero-book-now-btn"
                href="#booking"
                className="btn-primary inline-flex w-full max-w-[17.5rem] px-5 py-3.5 text-sm font-semibold sm:w-auto sm:max-w-none sm:px-7 sm:py-4"
              >
                ابدأ الحجز
                <Clock className="h-4 w-4" />
                <ArrowLeft className="h-4 w-4" />
              </a>
              <Link
                id="hero-contact-btn"
                href="/contact"
                className="inline-flex w-full max-w-[17.5rem] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-50 sm:w-auto sm:max-w-none sm:px-7 sm:py-4"
              >
                <MessageCircle className="h-4 w-4" />
                تحدث مع الفريق
              </Link>
            </div>

            <div className="hidden space-y-5 border-t border-slate-200 pt-6 lg:block">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 sm:gap-3">
                <Phone className="h-4 w-4 text-[var(--brand-secondary)]" />
                <span>للدعم المباشر والاستفسارات السريعة</span>
                <a
                  href={`tel:${settings.contact_phone}`}
                  dir="ltr"
                  className="font-semibold text-slate-950 hover:text-slate-700"
                >
                  {settings.contact_phone}
                </a>
              </div>
              <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
                {HERO_FACTS.map((fact) => (
                  <div key={fact.label} className="space-y-2 sm:border-r sm:border-slate-200 sm:pr-4">
                    <p className="text-2xl font-semibold text-slate-950">{fact.value}</p>
                    <p className="text-sm leading-6 text-slate-600">{fact.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="booking" className="relative min-w-0 lg:pt-8 xl:pt-10">
            <div className="absolute inset-x-8 top-4 h-28 rounded-full bg-[var(--brand-primary)]/10 blur-3xl" />
            <div className="relative rounded-[22px] border border-slate-200 bg-white/94 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:rounded-[34px]">
              <div className="mb-3 rounded-xl px-2 py-2 text-slate-950 sm:rounded-[26px] sm:border sm:border-slate-200 sm:bg-slate-50 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">ابدأ الحجز</p>
                    <p className="mt-1 text-lg font-semibold">رحلة واضحة من أول خطوة</p>
                  </div>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    dir="ltr"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:rounded-full sm:px-4"
                  >
                    دعم مباشر
                  </a>
                </div>
              </div>

              <div className="overflow-hidden rounded-[18px] sm:rounded-[28px]">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {priceCards.length > 0 && (
        <section id="prices" className="relative overflow-hidden px-3 py-14 sm:px-6 sm:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[var(--brand-primary)]/6 to-transparent" />
          <div className="pointer-events-none absolute -right-20 top-16 h-56 w-56 rounded-full bg-[var(--brand-secondary)]/14 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 bottom-10 h-52 w-52 rounded-full bg-[var(--brand-primary)]/12 blur-3xl" />
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-3xl">
              <span className="section-kicker">الأسعار</span>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl sm:text-5xl">
                أسطولنا المميز.
              </h2>
              <p className="section-copy mt-4 max-w-2xl">
أسعار تنافسية لرحلاتك داخل المملكة العربية السعودية

              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {priceCards.map((card) => (
                <article
                  key={card.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/92 p-2.5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(15,23,42,0.12)] sm:rounded-[30px] sm:p-3"
                >
                  <div className="relative h-[210px] overflow-hidden rounded-xl sm:h-[240px] sm:rounded-[24px]">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--brand-primary)_14%,white),color-mix(in_srgb,var(--brand-secondary)_20%,white))]">
                        <Plane className="h-10 w-10 text-[var(--brand-primary)]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/38 via-slate-950/6 to-transparent" />
                    <div className="absolute right-4 top-4 rounded-full border border-white/30 bg-white/85 px-3 py-1 text-[0.7rem] font-semibold text-slate-700 backdrop-blur">
                      جاهزة للحجز
                    </div>
                  </div>

                  <div className="px-1 pb-1 pt-5">
                    <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between min-[400px]:gap-4">
                      <div className="min-w-0">
                        
                        <h3 className="mt-2 break-words text-xl font-semibold text-slate-950 sm:text-2xl">
                          {card.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                         {card.passenger_capacity} راكب
                        </p>
                      </div>
                      <div className="w-fit rounded-2xl bg-[var(--brand-primary)]/10 px-3 py-2 text-left">
                        <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--brand-primary)]">
                          ابتداءً من
                        </p>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-950">
                            {priceFormatter.format(card.price)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">ريال</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-500">سعر واضح قبل التأكيد</p>
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-secondary)] shadow-[0_0_0_6px_color-mix(in_srgb,var(--brand-secondary)_18%,transparent)]" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            
          </div>
        </section>
      )}

      <section id="experience" className="px-3 py-14 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.45fr)] lg:items-end">
            <div className="max-w-3xl">
              <span className="section-kicker">لماذا نحن</span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950 min-[390px]:text-3xl sm:text-5xl">
                تجربة نقل واضحة من أول سعر إلى لحظة الوصول.
              </h2>
              <p className="section-copy mt-3 max-w-2xl text-sm sm:text-base">
                ركزنا التجربة على ما يحتاجه المسافر بسرعة: سعر مفهوم، تواصل سهل، وخدمة منظمة تمنح
                انطباعًا مطمئنًا قبل تأكيد الطلب.
              </p>
            </div>
            {/* <div className="rounded-lg border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/8 p-4">
              <p className="text-sm font-semibold text-slate-950">الخدمة مصممة لتقليل الأسئلة.</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                كل خطوة تعرض المعلومة التالية بوضوح حتى يكمل العميل الحجز بثقة أو يتواصل معنا مباشرة.
              </p>
            </div> */}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }, index) => (
              <article
                key={title}
                className="rounded-lg border border-black/10 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)]/10">
                    <Icon className="h-5 w-5 text-[var(--brand-primary)]" />
                  </div>
                  <span className="text-xs font-bold text-slate-300" dir="ltr">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-950 sm:text-lg">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-3 pb-14 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-7xl rounded-lg bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-12">
            <div className="lg:sticky lg:top-24">
              <span className="text-xs font-bold text-[var(--brand-secondary)]">كيف تعمل الخدمة</span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight min-[390px]:text-3xl sm:text-5xl">
                احجز رحلتك في ثلاث خطوات واضحة.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                مسار الحجز مرتب ليعرض السعر والاختيارات في وقتها، ثم يترك لك طريقة تواصل مباشرة إذا
                كان الطلب يحتاج تنسيقًا خاصًا.
              </p>
            </div>

            <div className="space-y-4">
              {HOW_IT_WORKS.map((item, index) => (
                <article
                  key={item.step}
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[4rem_1fr] sm:p-5"
                >
                  <div className="flex items-center gap-3 sm:block">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950 sm:h-14 sm:w-14 sm:text-lg">
                      {item.step}
                    </div>
                    {index < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden h-10 w-px bg-white/16 sm:mx-7 sm:mt-3 sm:block" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.desc}</p>
                  </div>
                </article>
              ))}

              <div className="rounded-lg border border-[var(--brand-secondary)]/30 bg-[var(--brand-secondary)]/12 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--brand-secondary)]">هل تحتاج مسارًا خاصًا؟</p>
                    <p className="mt-2 text-sm leading-7 text-slate-100 sm:text-base">
                      يمكن لفريقنا تجهيز عروض مخصصة وتنسيق الاستقبال أو الفنادق حسب تفاصيل الرحلة.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-3 min-[390px]:flex-row sm:flex-col lg:flex-row">
                    <a
                      href={`tel:${settings.contact_phone}`}
                      dir="ltr"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
                    >
                      <Phone className="h-4 w-4" />
                      {settings.contact_phone}
                    </a>
                    <Link
                      href="/contact"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/16 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      افتح نموذج التواصل
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter settings={settings} />
    </main>
  );
}
