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

  const selectedService =
    SERVICE_OPTIONS.find((service) => service.id === form.serviceId) ?? SERVICE_OPTIONS[0];
  const selectedCountry =
    COUNTRY_CODES.find((country) => country.value === form.countryCode) ?? COUNTRY_CODES[0];
  const selectedCar = CAR_OPTIONS.find((car) => car.id === form.carId);
  const total = useMemo(
    () => (selectedCar?.price ?? 0) + (form.hospitality ? HOSPITALITY_PRICE : 0),
    [form.hospitality, selectedCar?.price]
  );

  const updateField = <Key extends keyof BookingFormState>(
    field: Key,
    value: BookingFormState[Key]
  ) => {
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
    'w-full rounded-xl border border-black/8 bg-white/90 px-3 py-2.5 text-sm text-slate-950 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus:border-[var(--cms-primary)]/35 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/12';
  const labelClass = 'mb-1 block text-right text-xs font-semibold text-[var(--cms-primary)]';

  return (
    <div className="w-full rounded-[24px] border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),color-mix(in_srgb,var(--cms-primary)_4%,white))] p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950">احجز رحلتك الآن</h2>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--cms-secondary)]/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_18%,white),color-mix(in_srgb,var(--cms-primary)_10%,white))]">
          <Navigation className="h-5 w-5 text-[var(--cms-primary)]" />
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-black/6 bg-white/72 p-3 sm:p-4">
        <p className="mb-2 text-right text-xs font-bold tracking-[0.14em] text-[var(--cms-primary)]">
          اختر نوع الخدمة
        </p>
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
                    ? 'scale-[1.01] border-[var(--cms-primary)]/24 bg-[linear-gradient(135deg,var(--cms-primary),color-mix(in_srgb,var(--cms-secondary)_38%,var(--cms-primary)))] text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--cms-primary)_18%,transparent)]'
                    : 'border-black/6 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-primary)_5%,white),color-mix(in_srgb,var(--cms-secondary)_9%,white))] text-slate-950 hover:border-[var(--cms-primary)]/14'
                }`}
              >
                <span className="shrink-0 text-xl">{service.icon}</span>
                <span className="flex-1 text-sm font-bold">{service.label}</span>
                {isSelected && (
                  <span className="shrink-0 rounded-full bg-white/18 px-2 py-0.5 text-xs font-bold text-white">
                    محدد
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="my-4 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--cms-secondary)_80%,transparent),transparent)]" />
      </div>

      <div className="mb-4 flex gap-2 rounded-2xl border border-black/6 bg-white/72 p-1">
        {(['ذهاب فقط', 'ذهاب وعودة'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => updateField('tripMode', mode)}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              form.tripMode === mode
                ? 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_34%,var(--cms-primary)),var(--cms-primary))] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--cms-primary)_16%,transparent)]'
                : 'text-slate-700 hover:bg-[var(--cms-primary)]/6'
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
              className="min-w-[6.5rem] shrink-0 rounded-xl border border-black/8 bg-white/90 px-2 py-2.5 text-sm text-slate-950 focus:border-[var(--cms-primary)]/35 focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/12"
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
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">{selectedCountry.hint}</p>
          {errors.customerPhone && <p className="mt-1 text-xs text-red-600">{errors.customerPhone}</p>}
        </div>

        <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),color-mix(in_srgb,var(--cms-secondary)_10%,white))] p-3">
          <div className="mb-2 text-xs font-semibold text-[var(--cms-primary)]">رحلة الذهاب</div>
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
              className="min-w-0 flex-[2] rounded-xl border border-black/8 bg-white/90 px-1 py-2.5 text-center text-sm text-slate-950 [color-scheme:light] focus:border-[var(--cms-primary)]/35 focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/12"
            />
            <select
              name="hour"
              value={form.hour}
              onChange={(event) => updateField('hour', event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-black/8 bg-white/90 px-1 py-2.5 text-center text-sm text-slate-950 focus:border-[var(--cms-primary)]/35 focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/12"
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
              className="min-w-0 flex-1 rounded-xl border border-black/8 bg-white/90 px-1 py-2.5 text-center text-sm text-slate-950 focus:border-[var(--cms-primary)]/35 focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/12"
            >
              {MINUTES.map((minute) => (
                <option key={minute}>{minute}</option>
              ))}
            </select>
            <div className="flex shrink-0 flex-col gap-1">
              {(['صباح', 'مساء'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => updateField('period', period)}
                  className={`rounded-lg px-2 py-1 text-xs font-bold ${
                    form.period === period
                      ? 'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_34%,var(--cms-primary)),var(--cms-primary))] text-white'
                      : 'bg-[var(--cms-primary)]/8 text-[var(--cms-primary)]'
                  }`}
                >
                  {period}
                </button>
              ))}
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
          className={`select-none rounded-2xl border p-3 text-right ${
            form.hospitality
              ? 'border-[var(--cms-secondary)]/30 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_18%,white),white)]'
              : 'border-black/6 bg-white/72'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  form.hospitality
                    ? 'border-[var(--cms-secondary)] bg-[var(--cms-secondary)]'
                    : 'border-black/10'
                }`}
              >
                {form.hospitality && <Check className="h-3.5 w-3.5 text-slate-950" />}
              </span>
              <span className="text-xs font-bold text-slate-500">+ {HOSPITALITY_PRICE} ريال</span>
            </div>
            <div>
              <div className="text-sm font-black text-slate-950">☕ إضافة ضيافة</div>
              <div className="mt-0.5 text-xs text-slate-500">قهوة · تمر · ماء</div>
            </div>
          </div>
        </button>

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

        {selectedCar && (
          <div className="rounded-2xl border border-[var(--cms-secondary)]/22 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cms-secondary)_16%,white),rgba(255,255,255,0.96))] px-4 py-3 text-right">
            <p className="text-xs font-semibold text-[var(--cms-primary)]">المبلغ الإجمالي</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{total} ريال</p>
          </div>
        )}

        <div className="flex items-start justify-end gap-2 rounded-2xl border border-red-500/24 bg-red-500/6 px-4 py-3 text-right">
          <div>
            <p className="mb-0.5 text-xs font-black text-red-600">تنبيه مهم قبل الحجز</p>
            <p className="text-xs leading-relaxed text-red-700">
              لا يؤكد الحجز إلا بعد إرساله إلى واتساب الشركة وتلقي رد من الفريق.
            </p>
          </div>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        </div>

        {errors.general && <p className="text-center text-xs text-red-600">{errors.general}</p>}

        <button
          type="submit"
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#25d366,#128c7e)] py-3.5 text-base font-bold text-white shadow-[0_10px_24px_rgba(37,211,102,0.24)] hover:scale-[1.01] active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" />
          احجز عبر واتساب
        </button>
      </form>
    </div>
  );
}
