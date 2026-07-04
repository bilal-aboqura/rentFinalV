'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AlertCircle, Check, MessageCircle, Navigation } from 'lucide-react';

const WHATSAPP_PHONE = '201102770678';
const HOSPITALITY_PRICE = 50;

const SERVICE_OPTIONS = [
  { id: 'jeddah-makkah', icon: '✈️', label: 'مطار جدة ↔ مكة المكرمة' },
  { id: 'taif-makkah', icon: '🛬', label: 'مطار الطائف ↔ مكة المكرمة' },
  { id: 'makkah-madinah', icon: '🕌', label: 'مكة المكرمة ↔ المدينة المنورة' },
  { id: 'hourly-driver', icon: '🚗', label: 'سيارة بسائق - بالساعة' },
  { id: 'city-transfer', icon: '🏙️', label: 'توصيل داخل المدن' },
] as const;

const COUNTRY_CODES = [
  { value: '+966', label: '🇸🇦 +966', hint: 'السعودية +966' },
  { value: '+971', label: '🇦🇪 +971', hint: 'الإمارات +971' },
  { value: '+965', label: '🇰🇼 +965', hint: 'الكويت +965' },
  { value: '+974', label: '🇶🇦 +974', hint: 'قطر +974' },
  { value: '+973', label: '🇧🇭 +973', hint: 'البحرين +973' },
  { value: '+968', label: '🇴🇲 +968', hint: 'عمان +968' },
  { value: '+20', label: '🇪🇬 +20', hint: 'مصر +20' },
  { value: '+962', label: '🇯🇴 +962', hint: 'الأردن +962' },
  { value: '+961', label: '🇱🇧 +961', hint: 'لبنان +961' },
  { value: '+963', label: '🇸🇾 +963', hint: 'سوريا +963' },
  { value: '+964', label: '🇮🇶 +964', hint: 'العراق +964' },
  { value: '+967', label: '🇾🇪 +967', hint: 'اليمن +967' },
  { value: '+249', label: '🇸🇩 +249', hint: 'السودان +249' },
  { value: '+212', label: '🇲🇦 +212', hint: 'المغرب +212' },
  { value: '+1', label: '🇺🇸 +1', hint: 'أمريكا +1' },
] as const;

const CAR_OPTIONS = [
  { id: 'camry', label: 'كامري', detail: '200 ريال', price: 200 },
  { id: 'taurus', label: 'فورد توروس', detail: '250 ريال', price: 250 },
  { id: 'staria-6', label: 'فان ستاريا - 6 ركاب', detail: '250 ريال', price: 250 },
  { id: 'staria-7', label: 'فان ستاريا - 7 ركاب', detail: '275 ريال', price: 275 },
  { id: 'staria-8', label: 'فان ستاريا - 8 ركاب', detail: '300 ريال', price: 300 },
  { id: 'lexus-es', label: 'لكزس ES 2025', detail: '400 ريال', price: 400 },
  { id: 'hiace', label: 'باص هايس 11 راكب', detail: '450 ريال', price: 450 },
  { id: 'gmc-yukon', label: 'GMC يوكون', detail: '450 ريال', price: 450 },
  { id: 'coaster', label: 'باص كوستر', detail: '650 ريال', price: 650 },
] as const;

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

type TripMode = 'ذهاب فقط' | 'ذهاب وعودة';

interface BookingFormState {
  serviceId: (typeof SERVICE_OPTIONS)[number]['id'];
  tripMode: TripMode;
  customerName: string;
  countryCode: string;
  customerPhone: string;
  from: string;
  to: string;
  date: string;
  hour: string;
  minute: string;
  period: 'صباح' | 'مساء';
  flightNumber: string;
  passengers: string;
  hospitality: boolean;
  carId: string;
}

const INITIAL_FORM: BookingFormState = {
  serviceId: 'jeddah-makkah',
  tripMode: 'ذهاب فقط',
  customerName: '',
  countryCode: '+966',
  customerPhone: '',
  from: '',
  to: '',
  date: '',
  hour: '01',
  minute: '00',
  period: 'صباح',
  flightNumber: '',
  passengers: '1',
  hospitality: false,
  carId: '',
};

function makeBookingReference() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `DQ-${stamp}-${suffix}`;
}

function normalizePhone(countryCode: string, phone: string) {
  const localPhone = phone.replace(/[^\d]/g, '').replace(/^0+/, '');
  return `${countryCode}${localPhone}`;
}

function buildWhatsappMessage(params: {
  form: BookingFormState;
  bookingReference: string;
  serviceLabel: string;
  carLabel: string;
  total: number;
}) {
  const { form, bookingReference, serviceLabel, carLabel, total } = params;
  const captainTime = `${form.hour}:${form.minute} ${form.period}`;
  const customerPhone = normalizePhone(form.countryCode, form.customerPhone);
  const tripType = `${serviceLabel} - ${form.tripMode}`;

  return `*بيانات حجز رحلة الى : ${form.to || 'غير محدد'}*
🔖 رقم الحجز : ${bookingReference}

🔹 نوع الرحلة : ${tripType}
🔹 اسم العميل : ${form.customerName}
🔹 جوال العميل : ${customerPhone}
🔹 موقع العميل : ${form.from}
🔹 رقم رحلة الطيران : ${form.flightNumber || 'غير محدد'}
🔹 تاريخ حضور الكابتن : ${form.date}
🔹 وقت حضور الكابتن : ${captainTime}
🔹 الوجهة الى : ${form.to}

🔹 نوع السيارة : ${carLabel}${form.hospitality ? ' + ضيافة' : ''}
🔹 المبلغ : ${total} ريال

👨‍✈️ مسؤول الكباتن : غير محدد
📞 جوال الكابتن : غير محدد

شكراً لاختياركم مؤسسه دقة الوقت
( رحلتك الآمنة تبدأ معنا بعد مشيئة الله )`;
}

function getTodayDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function BookingForm() {
  const [form, setForm] = useState<BookingFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedService = SERVICE_OPTIONS.find((service) => service.id === form.serviceId) ?? SERVICE_OPTIONS[0];
  const selectedCountry = COUNTRY_CODES.find((country) => country.value === form.countryCode) ?? COUNTRY_CODES[0];
  const selectedCar = CAR_OPTIONS.find((car) => car.id === form.carId);
  const total = useMemo(
    () => (selectedCar?.price ?? 0) + (form.hospitality ? HOSPITALITY_PRICE : 0),
    [form.hospitality, selectedCar?.price]
  );

  const updateField = <Key extends keyof BookingFormState>(field: Key, value: BookingFormState[Key]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.customerName.trim()) nextErrors.customerName = 'يرجى إدخال اسم العميل.';
    if (!form.customerPhone.trim()) nextErrors.customerPhone = 'يرجى إدخال جوال العميل.';
    if (!form.from.trim()) nextErrors.from = 'يرجى إدخال موقع العميل أو نقطة الانطلاق.';
    if (!form.to.trim()) nextErrors.to = 'يرجى إدخال الوجهة.';
    if (!form.date) nextErrors.date = 'يرجى اختيار تاريخ حضور الكابتن.';
    if (!form.carId) nextErrors.carId = 'يرجى اختيار نوع السيارة.';
    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    const bookingReference = makeBookingReference();
    const message = buildWhatsappMessage({
      form,
      bookingReference,
      serviceLabel: selectedService.label,
      carLabel: selectedCar ? `${selectedCar.label} - ${selectedCar.detail}` : 'غير محدد',
      total,
    });
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  };

  const fieldClass =
    'w-full rounded-xl border border-[#f5e6c8] bg-[#faf8f3] px-3 py-2.5 text-sm text-[#1e3165] placeholder:text-slate-400 focus:border-[#c9a96e] focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/20';
  const labelClass = 'mb-1 block text-right text-xs font-semibold text-[#b8912a]';

  return (
<<<<<<< HEAD
    <div className="relative overflow-hidden rounded-[18px] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),color-mix(in_srgb,var(--cms-primary)_4%,white))] shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:rounded-[32px]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--cms-secondary)_68%,white),transparent)]" />
      <div className="border-b border-black/6 px-3 pb-3 pt-3 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:gap-5">
            <div className="flex flex-row-reverse items-center justify-between gap-3 sm:flex-row sm:items-start">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-500">الحجز</p>
              <h2 className="mt-1 text-3xl font-semibold text-slate-950">
                احجز رحلتك في ثلاث خطوات واضحة
              </h2>
            </div>
            <div className="w-fit rounded-full border border-[var(--cms-primary)]/14 bg-[var(--cms-primary)]/8 px-3 py-2 text-xs font-semibold text-[var(--cms-primary)] shadow-[0_8px_18px_color-mix(in_srgb,var(--cms-primary)_12%,transparent)]">
              الخطوة {activeStep} من 3
            </div>
=======
    <div className="w-full rounded-2xl border border-[#f5e6c8] bg-white p-4 shadow-[0_24px_64px_rgba(30,49,101,0.10)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#1e3165]">احجز رحلتك الآن</h2>
        <Navigation className="h-5 w-5 text-[#c9a96e]" />
      </div>

      <div className="mb-5">
        <p className="mb-2 text-right text-xs font-bold text-[#1e3165]">اختر نوع الخدمة</p>
        <div className="grid grid-cols-1 gap-2">
          {SERVICE_OPTIONS.map((service) => {
            const isSelected = form.serviceId === service.id;

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => updateField('serviceId', service.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-right transition-all ${
                  isSelected
                    ? 'scale-[1.01] border-[#c9a96e] bg-[linear-gradient(135deg,#1e3165,#2a4494)] text-white shadow-[0_4px_16px_rgba(30,49,101,0.25)]'
                    : 'border-[#f5e6c8] bg-[#f5f0e8] text-[#1e3165]'
                }`}
              >
                <span className="shrink-0 text-xl">{service.icon}</span>
                <span className="flex-1 text-sm font-bold">{service.label}</span>
                {isSelected && (
                  <span className="shrink-0 rounded-full bg-[#c9a96e] px-2 py-0.5 text-xs font-bold text-[#1e3165]">
                    محدد
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,#c9a96e,transparent)]" />
      </div>

      <div className="mb-4 flex gap-2 rounded-xl bg-[#f5f0e8] p-1">
        {(['ذهاب فقط', 'ذهاب وعودة'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => updateField('tripMode', mode)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold ${
              form.tripMode === mode
                ? 'bg-[linear-gradient(135deg,#c9a96e,#1e3165)] text-white'
                : 'text-[#1e3165]'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="customer-name">
            اسم العميل
          </label>
          <input
            id="customer-name"
            name="name"
            value={form.customerName}
            onChange={(event) => updateField('customerName', event.target.value)}
            placeholder="الاسم الكامل"
            className={fieldClass}
          />
          {errors.customerName && <p className="mt-1 text-xs text-red-600">{errors.customerName}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="customer-phone">
            جوال العميل
          </label>
          <div className="flex gap-2">
            <select
              value={form.countryCode}
              onChange={(event) => updateField('countryCode', event.target.value)}
              className="min-w-[6.5rem] shrink-0 rounded-xl border border-[#f5e6c8] bg-[#faf8f3] px-2 py-2.5 text-sm text-[#1e3165] focus:border-[#c9a96e] focus:outline-none"
              dir="ltr"
              aria-label="مقدمة الدولة"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            <input
              id="customer-phone"
              name="phone"
              value={form.customerPhone}
              onChange={(event) => updateField('customerPhone', event.target.value)}
              placeholder="5xxxxxxxx"
              className={fieldClass}
              inputMode="tel"
              dir="ltr"
            />
>>>>>>> 08b7e5a504a4948589c6f1885e837834dff7a74c
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">{selectedCountry.hint}</p>
          {errors.customerPhone && <p className="mt-1 text-xs text-red-600">{errors.customerPhone}</p>}
        </div>

        <div className="rounded-xl border border-[#f5e6c8] bg-[#fdf9f0] p-3">
          <div className="mb-2 text-xs font-semibold text-[#b8912a]">رحلة الذهاب</div>
          <div className="flex flex-col gap-2">
            <input
              name="from"
              value={form.from}
              onChange={(event) => updateField('from', event.target.value)}
              placeholder="نقطة الانطلاق - مثال: مطار الملك عبدالعزيز"
              className={fieldClass}
            />
            {errors.from && <p className="text-xs text-red-600">{errors.from}</p>}
            <input
              name="to"
              value={form.to}
              onChange={(event) => updateField('to', event.target.value)}
              placeholder="الوجهة - مثال: الحرم المكي - مكة المكرمة"
              className={fieldClass}
            />
            {errors.to && <p className="text-xs text-red-600">{errors.to}</p>}
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between gap-2">
            <span className="text-xs text-slate-500">الفترة</span>
            <span className="text-xs text-slate-500">الدقيقة : الساعة - التاريخ</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              required
              name="date"
              type="date"
              min={getTodayDateString()}
              value={form.date}
              onChange={(event) => updateField('date', event.target.value)}
              className="min-w-0 flex-[2] rounded-xl border border-[#f5e6c8] bg-[#faf8f3] px-1 py-2.5 text-center text-sm text-[#1e3165] [color-scheme:light] focus:border-[#c9a96e] focus:outline-none"
            />
            <select
              name="hour"
              value={form.hour}
              onChange={(event) => updateField('hour', event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[#f5e6c8] bg-[#faf8f3] px-1 py-2.5 text-center text-sm text-[#1e3165] focus:border-[#c9a96e] focus:outline-none"
            >
              {HOURS.map((hour) => (
                <option key={hour}>{hour}</option>
              ))}
            </select>
            <span className="shrink-0 text-sm font-bold text-slate-500">:</span>
            <select
              name="minute"
              value={form.minute}
              onChange={(event) => updateField('minute', event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[#f5e6c8] bg-[#faf8f3] px-1 py-2.5 text-center text-sm text-[#1e3165] focus:border-[#c9a96e] focus:outline-none"
            >
              {MINUTES.map((minute) => (
                <option key={minute}>{minute}</option>
              ))}
            </select>
            <div className="flex shrink-0 flex-col gap-1">
              {(['صباح', 'مساء'] as const).map((period) => (
                <button
<<<<<<< HEAD
                  key={item.label}
                  id={`step-${item.value}-tab`}
                  onClick={() => activeStep > item.value && setStep(item.value)}
                  className={`min-w-0 rounded-xl border px-2 py-2.5 text-center transition-all sm:px-4 sm:py-4 sm:text-right ${
                    isActive
                      ? 'border-[var(--cms-primary)]/24 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-primary)_9%,white),color-mix(in_srgb,var(--cms-secondary)_12%,white))] shadow-[0_14px_28px_color-mix(in_srgb,var(--cms-primary)_12%,transparent)]'
                      : isComplete
                        ? 'border-black/6 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)] hover:border-[var(--cms-primary)]/16'
                        : 'border-black/6 bg-white/72'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 sm:justify-start sm:gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-9 sm:w-9 sm:text-sm ${
                        isActive
                          ? 'bg-[linear-gradient(135deg,var(--cms-primary),color-mix(in_srgb,var(--cms-secondary)_44%,var(--cms-primary)))] text-white shadow-[0_10px_18px_color-mix(in_srgb,var(--cms-primary)_22%,transparent)]'
                          : isComplete
                            ? 'bg-[var(--cms-secondary)] text-slate-950'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isComplete ? <CheckCircle className="h-4 w-4" /> : item.value}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-950 sm:text-base">{item.label}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {step !== 4 && (
            <div className="hidden rounded-2xl border border-[var(--cms-secondary)]/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_10%,white),rgba(255,255,255,0.96))] p-4 sm:block">
              <p className="text-sm font-semibold text-slate-950">{STEP_NOTES[step].title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{STEP_NOTES[step].description}</p>
=======
                  key={period}
                  type="button"
                  onClick={() => updateField('period', period)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${
                    form.period === period
                      ? 'bg-[linear-gradient(135deg,#c9a96e,#1e3165)] text-white'
                      : 'bg-[#f5e6c8] text-[#1e3165]'
                  }`}
                >
                  {period}
                </button>
              ))}
>>>>>>> 08b7e5a504a4948589c6f1885e837834dff7a74c
            </div>
          </div>
          {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
        </div>

        <div>
          <label className={labelClass} htmlFor="flight-number">
            رقم رحلة الوصول
          </label>
          <input
            id="flight-number"
            name="flight"
            value={form.flightNumber}
            onChange={(event) => updateField('flightNumber', event.target.value)}
            placeholder="مثال: SV123"
            className={fieldClass}
            dir="ltr"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="passengers">
            عدد الركاب
          </label>
          <div className="flex items-center gap-2">
            <input
              id="passengers"
              name="passengers"
              type="number"
              min="1"
              max="50"
              value={form.passengers}
              onChange={(event) => updateField('passengers', event.target.value)}
              className={fieldClass}
            />
            <span className="shrink-0 text-sm text-slate-500">راكب</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => updateField('hospitality', !form.hospitality)}
          className={`select-none rounded-xl p-3 text-right ${
            form.hospitality
              ? 'border-2 border-[#c9a96e] bg-[#fff7df]'
              : 'border-2 border-[#f5e6c8] bg-[#fafaf8]'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  form.hospitality ? 'border-[#c9a96e] bg-[#c9a96e]' : 'border-[#f5e6c8]'
                }`}
              >
                {form.hospitality && <Check className="h-3.5 w-3.5 text-[#1e3165]" />}
              </span>
              <span className="text-xs font-bold text-slate-500">+ {HOSPITALITY_PRICE} ريال</span>
            </div>
            <div>
              <div className="text-sm font-black text-[#1e3165]">☕ إضافة ضيافة</div>
              <div className="mt-0.5 text-xs text-slate-500">قهوة · تمر · ماء</div>
            </div>
          </div>
        </button>

<<<<<<< HEAD
            {(selectedPickup || selectedDestination || form.tripDateTime) && (
              <div className="rounded-2xl border border-[var(--cms-secondary)]/18 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_14%,white),rgba(255,255,255,0.96))] p-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                  معاينة الرحلة
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-slate-400">الانطلاق</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {selectedPickup?.name ?? 'لم يتم الاختيار بعد'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.18em] text-slate-400">الوجهة</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {selectedDestination?.name ?? 'لم يتم الاختيار بعد'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs tracking-[0.18em] text-slate-400">موعد الانطلاق</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {form.tripDateTime
                        ? new Date(form.tripDateTime).toLocaleString('ar-EG', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'لم يتم الاختيار بعد'}
                    </p>
                  </div>
                </div>
              </div>
            )}
=======
        <div>
          <label className={labelClass} htmlFor="car-type">
            نوع السيارة
          </label>
          <select
            id="car-type"
            name="car"
            value={form.carId}
            onChange={(event) => updateField('carId', event.target.value)}
            className={fieldClass}
          >
            <option value="">اختر نوع السيارة</option>
            {CAR_OPTIONS.map((car) => (
              <option key={car.id} value={car.id}>
                {car.label} - {car.detail}
              </option>
            ))}
          </select>
          {errors.carId && <p className="mt-1 text-xs text-red-600">{errors.carId}</p>}
        </div>
>>>>>>> 08b7e5a504a4948589c6f1885e837834dff7a74c

        {selectedCar && (
          <div className="rounded-xl border border-[#c9a96e]/50 bg-[#fdf9f0] px-4 py-3 text-right">
            <p className="text-xs font-semibold text-[#b8912a]">المبلغ الإجمالي</p>
            <p className="mt-1 text-2xl font-black text-[#1e3165]">{total} ريال</p>
          </div>
        )}

<<<<<<< HEAD
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),color-mix(in_srgb,var(--cms-primary)_4%,white))] p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs tracking-[0.18em] text-slate-400">المسار</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {selectedPickup?.name ?? 'الانطلاق'} إلى {selectedDestination?.name ?? 'الوجهة'}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.18em] text-slate-400">الوقت</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {form.tripDateTime
                      ? new Date(form.tripDateTime).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'قيد التحديد'}
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.18em] text-slate-400">الحالة</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {pricingRules.length > 0 ? 'الأسعار متاحة' : 'قد تحتاج إلى تسعير يدوي'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {VEHICLE_OPTIONS.map(({ id, label, desc, icon: Icon }) => {
                const pricing = pricingRules.find((rule) => rule.vehicle_class === id);
                const isSelected = resolvedVehicleClass === id;

                return (
                  <button
                    key={id}
                    id={`vehicle-${id}`}
                    onClick={() => pricing && updateField('vehicleClass', id)}
                    className={`rounded-2xl border p-5 text-right transition-all sm:flex sm:items-center sm:justify-between ${
                      pricing
                        ? isSelected
                          ? 'border-[var(--cms-primary)]/24 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-primary)_8%,white),color-mix(in_srgb,var(--cms-secondary)_12%,white))] shadow-[0_16px_34px_color-mix(in_srgb,var(--cms-primary)_12%,transparent)]'
                          : 'border-black/6 bg-white/92 shadow-[0_10px_22px_rgba(15,23,42,0.04)] hover:border-[var(--cms-primary)]/16 hover:bg-white'
                        : 'cursor-not-allowed border-black/6 bg-slate-50/85 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--cms-primary)]/10 bg-[var(--cms-primary)]/8">
                        <Icon className="h-5 w-5 text-[var(--cms-primary)]" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-slate-950">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--cms-secondary)]">
                        {pricing ? 'سعر المسار' : 'التوفر'}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-950" dir="ltr">
                        {pricing ? formatPrice(Number(pricing.price)) : 'تواصل معنا'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedPricing ? (
              <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),color-mix(in_srgb,var(--cms-primary)_4%,white))] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                      السعر التقديري
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      سعر واضح وثابت يساعد العميل على فهم الحجز مباشرة.
                    </p>
                  </div>
                  <p className="text-3xl font-semibold text-[var(--cms-primary)]" dir="ltr">
                    {formatPrice(Number(selectedPricing.price))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-100 p-2.5">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      لا يوجد سعر منشور لهذا المسار بعد
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      يمكنك إرسال الطلب عبر صفحة التواصل ريثما يجهز فريق التشغيل إعداد المسار.
                    </p>
                    <Link href="/contact" className="btn-secondary mt-4 inline-flex px-4 py-3 text-sm font-semibold">
                      افتح نموذج التواصل
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                id="step2-back-btn"
                onClick={() => setStep(1)}
                className="btn-secondary inline-flex w-full px-6 py-4 text-sm font-semibold sm:w-auto"
              >
                رجوع
              </button>
              <button
                id="step2-next-btn"
                onClick={() => {
                  if (!selectedPricing) {
                    setErrors({ vehicleClass: 'لا يوجد سعر متاح لهذا المسار حاليًا.' });
                    return;
                  }
                  setErrors({});
                  setStep(3);
                }}
                className="btn-primary inline-flex w-full px-6 py-4 text-sm font-semibold sm:mr-auto sm:w-auto"
              >
                متابعة إلى البيانات
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {errors.vehicleClass && <p className="text-sm text-red-500">{errors.vehicleClass}</p>}
=======
        <div className="flex items-start justify-end gap-2 rounded-xl border border-red-500/40 bg-red-500/8 px-4 py-3 text-right">
          <div>
            <p className="mb-0.5 text-xs font-black text-red-600">تنبيه مهم قبل الحجز</p>
            <p className="text-xs leading-relaxed text-red-700">
              لا يؤكد الحجز إلا بعد إرساله إلى واتساب الشركة وتلقي رد من الفريق.
            </p>
>>>>>>> 08b7e5a504a4948589c6f1885e837834dff7a74c
          </div>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        </div>

        {errors.general && <p className="text-center text-xs text-red-600">{errors.general}</p>}

<<<<<<< HEAD
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="customer-name">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[var(--cms-primary)]" />
                        الاسم الكامل
                      </span>
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      placeholder="الاسم الكامل"
                      value={form.customerName}
                      onChange={(event) => updateField('customerName', event.target.value)}
                      className="input-shell text-sm"
                    />
                    {errors.customerName && (
                      <p className="mt-2 text-xs text-red-500">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="customer-email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[var(--cms-primary)]" />
                        البريد الإلكتروني
                      </span>
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      dir="ltr"
                      placeholder="name@example.com"
                      value={form.customerEmail}
                      onChange={(event) => updateField('customerEmail', event.target.value)}
                      className="input-shell text-sm"
                    />
                    {errors.customerEmail && (
                      <p className="mt-2 text-xs text-red-500">{errors.customerEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="customer-phone">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[var(--cms-primary)]" />
                        رقم الهاتف
                      </span>
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      dir="ltr"
                      placeholder="+20 100 000 0000"
                      value={form.customerPhone}
                      onChange={(event) => updateField('customerPhone', event.target.value)}
                      className="input-shell text-sm"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      استخدم رقمًا واضحًا مع المقدمة الدولية ليتمكن الفريق من التواصل بسرعة.
                    </p>
                    {errors.customerPhone && (
                      <p className="mt-2 text-xs text-red-500">{errors.customerPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--cms-secondary)]/16 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_10%,white),rgba(255,255,255,0.96))] p-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                    ملخص الحجز
                  </p>
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-[var(--cms-primary)]" />
                        <span className="text-slate-600">المسار</span>
                      </div>
                      <span className="text-left font-semibold text-slate-950">
                        {selectedPickup?.name ?? 'الانطلاق'} إلى {selectedDestination?.name ?? 'الوجهة'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 text-[var(--cms-primary)]" />
                        <span className="text-slate-600">موعد الانطلاق</span>
                      </div>
                      <span className="text-left font-semibold text-slate-950">
                        {form.tripDateTime
                          ? new Date(form.tripDateTime).toLocaleString('ar-EG', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'قيد التحديد'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-2">
                        <Car className="mt-0.5 h-4 w-4 text-[var(--cms-primary)]" />
                        <span className="text-slate-600">فئة السيارة</span>
                      </div>
                      <span className="font-semibold text-slate-950">
                        {VEHICLE_CLASS_LABELS[resolvedVehicleClass]}
                      </span>
                    </div>
                    <div className="border-t border-black/6 pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-base font-semibold text-slate-950">السعر التقديري</span>
                        <span className="text-2xl font-semibold text-[var(--cms-primary)]" dir="ltr">
                          {selectedPricing ? formatPrice(Number(selectedPricing.price)) : 'قيد التحديد'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),color-mix(in_srgb,var(--cms-primary)_4%,white))] p-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                    ملاحظة التأكيد
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    لا يتم تحصيل الدفع في هذه الخطوة. نحن نستقبل بيانات الحجز فقط ثم يتابع
                    الفريق معك لتأكيد الرحلة.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                id="step3-back-btn"
                onClick={() => setStep(2)}
                className="btn-secondary inline-flex w-full px-6 py-4 text-sm font-semibold sm:w-auto"
              >
                رجوع
              </button>
              <button
                id="submit-booking-btn"
                onClick={handleSubmit}
                disabled={isPending}
                className="btn-primary inline-flex w-full px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 sm:mr-auto sm:w-auto"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    تأكيد طلب الحجز
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
=======
        <button
          type="submit"
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#25d366,#128c7e)] py-3.5 text-base font-bold text-white shadow-[0_6px_20px_rgba(37,211,102,0.30)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5" />
          احجز عبر واتساب
        </button>
      </form>
>>>>>>> 08b7e5a504a4948589c6f1885e837834dff7a74c
    </div>
  );
}
