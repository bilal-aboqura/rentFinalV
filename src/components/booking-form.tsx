'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Car as CarIcon,
  CheckCircle2,
  Coffee,
  CreditCard,
  Landmark,
  MapPin,
  MessageCircle,
  Navigation,
  Plane,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { getPublicLocationsAction } from '@/app/actions/locations';
import { getRouteCarPricingAction } from '@/app/actions/pricing';
import { submitBookingRequestAction } from '@/app/actions/booking';
import {
  getPublicBankDetailsAction,
  getPublicHospitalityOptionsAction,
} from '@/app/actions/cms';
import type { BankAccount, CarPriceQuote, HospitalityOption, Location } from '@/types';
import type { EndpointType, PaymentMethod, TripType } from '@/lib/validation/transfer';

const COUNTRY_CODES = [
  { value: '+966', label: 'SA +966' },
  { value: '+971', label: 'AE +971' },
  { value: '+965', label: 'KW +965' },
  { value: '+974', label: 'QA +974' },
  { value: '+973', label: 'BH +973' },
  { value: '+968', label: 'OM +968' },
  { value: '+20', label: 'EG +20' },
  { value: '+962', label: 'JO +962' },
  { value: '+961', label: 'LB +961' },
  { value: '+964', label: 'IQ +964' },
  { value: '+212', label: 'MA +212' },
  { value: '+1', label: 'US +1' },
] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; icon: typeof Wallet; labelKey: string; descKey: string }[] = [
  { value: 'cash', icon: Wallet, labelKey: 'payment.cash', descKey: 'payment.cash.desc' },
  { value: 'card_pos', icon: CreditCard, labelKey: 'payment.card_pos', descKey: 'payment.card_pos.desc' },
  { value: 'bank_transfer', icon: Landmark, labelKey: 'payment.bank_transfer', descKey: 'payment.bank_transfer.desc' },
];

const ENDPOINT_TYPES: { value: EndpointType; icon: typeof Plane; labelKey: string }[] = [
  { value: 'airport', icon: Plane, labelKey: 'loc.type.airport' },
  { value: 'hotel', icon: Building2, labelKey: 'loc.type.hotel' },
  { value: 'address', icon: MapPin, labelKey: 'loc.type.address' },
  { value: 'other', icon: Navigation, labelKey: 'loc.type.other' },
];

interface EndpointState {
  type: EndpointType;
  locationId: string;
  text: string;
}

interface FormState {
  customerName: string;
  countryCode: string;
  customerPhone: string;
  customerEmail: string;
  tripType: TripType;
  pickup: EndpointState;
  dropoff: EndpointState;
  date: string;
  time: string;
  flightNumber: string;
  returnDate: string;
  returnTime: string;
  returnFlightNumber: string;
  returnPickup: EndpointState;
  returnDropoff: EndpointState;
  passengerCount: number;
  hospitalitySelections: Record<string, number>;
  carId: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

const INITIAL_FORM: FormState = {
  customerName: '',
  countryCode: '+966',
  customerPhone: '',
  customerEmail: '',
  tripType: 'one_way',
  pickup: { type: 'airport', locationId: '', text: '' },
  dropoff: { type: 'hotel', locationId: '', text: '' },
  date: '',
  time: '',
  flightNumber: '',
  returnDate: '',
  returnTime: '',
  returnFlightNumber: '',
  returnPickup: { type: 'hotel', locationId: '', text: '' },
  returnDropoff: { type: 'airport', locationId: '', text: '' },
  passengerCount: 1,
  hospitalitySelections: {},
  carId: '',
  paymentMethod: 'cash',
  notes: '',
};

const STEPS = [1, 2, 3, 4, 5] as const;

function normalizePhone(countryCode: string, phone: string): string {
  const digits = phone.replace(/[^\d]/g, '').replace(/^0+/, '');
  return `${countryCode}${digits}`;
}

function todayString(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function BookingForm() {
  const { t, lang, dir } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const [locations, setLocations] = useState<Location[]>([]);
  const [hospitalityOptions, setHospitalityOptions] = useState<HospitalityOption[]>([]);
  const [quotes, setQuotes] = useState<CarPriceQuote[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [routeKey, setRouteKey] = useState('');

  const [result, setResult] = useState<{
    bookingReference: string;
    whatsappUrl: string;
    whatsappDelivered: boolean;
  } | null>(null);

  // ── Load locations on mount (cars are embedded in the price quotes) ──
  useEffect(() => {
    let active = true;
    (async () => {
      const [locsRes, hospitalityRes] = await Promise.all([
        getPublicLocationsAction(),
        getPublicHospitalityOptionsAction(),
      ]);
      if (!active) return;
      setLocations(locsRes);
      setHospitalityOptions(hospitalityRes);
    })();
    return () => {
      active = false;
    };
  }, []);

  const airports = useMemo(() => locations.filter((l) => l.type === 'airport'), [locations]);
  const cities = useMemo(() => locations.filter((l) => l.type === 'city'), [locations]);

  // ── Load pricing whenever both route endpoints resolve ──
  const routeReady = Boolean(
    form.pickup.locationId &&
      form.dropoff.locationId &&
      form.pickup.locationId !== form.dropoff.locationId,
  );
  const currentRouteKey = routeReady
    ? `${form.pickup.locationId}|${form.dropoff.locationId}`
    : '';
  const pricingStale = currentRouteKey !== routeKey;

  useEffect(() => {
    if (!routeReady) return;
    let active = true;
    (async () => {
      const res = await getRouteCarPricingAction(form.pickup.locationId, form.dropoff.locationId);
      if (!active) return;
      setQuotes(res.success ? res.data : []);
      setPricingLoaded(true);
      setRouteKey(`${form.pickup.locationId}|${form.dropoff.locationId}`);
    })();
    return () => {
      active = false;
    };
  }, [form.pickup.locationId, form.dropoff.locationId, routeReady]);

  // Derive the effective quotes for the CURRENT route so stale results
  // from a previous route don't leak into the car step.
  const effectiveQuotes = useMemo(
    () => (routeReady && !pricingStale ? quotes : []),
    [pricingStale, quotes, routeReady],
  );
  const availableQuotes = useMemo(
    () =>
      effectiveQuotes.filter(
        (q) => q.available && q.car.passenger_capacity >= form.passengerCount,
      ),
    [effectiveQuotes, form.passengerCount],
  );
  const selectedQuote = useMemo(
    () => availableQuotes.find((q) => q.car.id === form.carId) ?? null,
    [availableQuotes, form.carId],
  );
  const pricingLoading = routeReady && (pricingStale || !pricingLoaded);

  const roundTripMultiplier = form.tripType === 'round_trip' ? 2 : 1;
  const displayTotal = selectedQuote ? selectedQuote.price * roundTripMultiplier : 0;

  const hospitalitySummary = useMemo(
    () =>
      hospitalityOptions
        .map((option) => {
          const quantity = form.hospitalitySelections[option.id] ?? 0;
          if (quantity < 1) return null;
          return {
            id: option.id,
            label: lang === 'ar' ? option.name_ar : option.name,
            quantity,
          };
        })
        .filter((item): item is { id: string; label: string; quantity: number } => item !== null),
    [form.hospitalitySelections, hospitalityOptions, lang],
  );

  const hospitalityAvailable = selectedQuote?.car.hospitality_enabled === true;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key as string]: '', general: '' }));
    setServerError('');
  };

  const updatePassengerCount = (value: number) => {
    const passengerCount = Math.min(20, Math.max(1, Number.isFinite(value) ? value : 1));
    setForm((prev) => ({
      ...prev,
      passengerCount,
      hospitalitySelections: Object.fromEntries(
        Object.entries(prev.hospitalitySelections as Record<string, number>)
          .map(([optionId, quantity]) => [optionId, Math.min(quantity, passengerCount)])
          .filter(([, quantity]) => Number(quantity) > 0),
      ),
      carId: '',
    }));
    setErrors((prev) => ({ ...prev, passengerCount: '', carId: '', hospitalitySelections: '' }));
    setServerError('');
  };

  const updateHospitalityQuantity = (optionId: string, quantity: number) => {
    const nextQuantity = Math.min(form.passengerCount, Math.max(0, quantity));
    setForm((prev) => {
      const nextSelections = { ...prev.hospitalitySelections };
      if (nextQuantity === 0) {
        delete nextSelections[optionId];
      } else {
        nextSelections[optionId] = nextQuantity;
      }

      return {
        ...prev,
        hospitalitySelections: nextSelections,
      };
    });
    setErrors((prev) => ({ ...prev, hospitalitySelections: '' }));
    setServerError('');
  };

  const setTripType = (tripType: TripType) => {
    setForm((prev) => {
      if (tripType === prev.tripType) return prev;
      if (tripType === 'round_trip') {
        return {
          ...prev,
          tripType,
          returnPickup: prev.returnPickup.locationId ? prev.returnPickup : { ...prev.dropoff },
          returnDropoff: prev.returnDropoff.locationId ? prev.returnDropoff : { ...prev.pickup },
        };
      }
      return { ...prev, tripType };
    });
    setErrors((prev) => ({ ...prev, tripType: '', returnPickup: '', returnDropoff: '' }));
    setServerError('');
  };

  const updateEndpoint = (
    which: 'pickup' | 'dropoff' | 'returnPickup' | 'returnDropoff',
    next: Partial<EndpointState>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [which]: { ...prev[which], ...next },
      ...(which === 'pickup' || which === 'dropoff' ? { carId: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [which]: '' }));
    setServerError('');
  };

  const involvesAirport = form.pickup.type === 'airport' || form.dropoff.type === 'airport';
  const returnInvolvesAirport =
    form.returnPickup.type === 'airport' || form.returnDropoff.type === 'airport';

  // ── Per-step validation ──
  const validateStep = (current: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (current === 1) {
      if (form.customerName.trim().length < 2) e.customerName = t('err.name');
      const phone = normalizePhone(form.countryCode, form.customerPhone);
      if (!/^\+?[1-9]\d{6,14}$/.test(phone)) e.customerPhone = t('err.phone');
      if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail))
        e.customerEmail = t('err.email');
    }
    if (current === 2) {
      if (!form.pickup.locationId) e.pickup = t('err.from');
      if (!form.dropoff.locationId) e.dropoff = t('err.to');
      if (
        form.pickup.locationId &&
        form.dropoff.locationId &&
        form.pickup.locationId === form.dropoff.locationId
      )
        e.dropoff = t('err.sameLocation');
      if (!Number.isInteger(form.passengerCount) || form.passengerCount < 1 || form.passengerCount > 20) {
        e.passengerCount = t('err.passengers');
      }
      if (!form.date) e.date = t('err.date');
      if (!form.time) e.time = t('err.time');
      if (involvesAirport && !form.flightNumber.trim()) e.flightNumber = t('err.flight');
      if (form.tripType === 'round_trip') {
        if (!form.returnPickup.locationId) e.returnPickup = t('err.from');
        if (!form.returnDropoff.locationId) e.returnDropoff = t('err.to');
        if (
          form.returnPickup.locationId &&
          form.returnDropoff.locationId &&
          form.returnPickup.locationId === form.returnDropoff.locationId
        )
          e.returnDropoff = t('err.sameLocation');
        if (!form.returnDate) e.returnDate = t('err.returnDate');
        if (!form.returnTime) e.returnTime = t('err.returnTime');
        if (returnInvolvesAirport && !form.returnFlightNumber.trim()) {
          e.returnFlightNumber = t('err.flight');
        }
      }
    }
    if (current === 3) {
      if (!selectedQuote) e.carId = t('err.car');
    }
    if (current === 4) {
      if (!form.paymentMethod) e.paymentMethod = t('err.payment');
    }
    return e;
  };

  const goNext = () => {
    const e = validateStep(step);
    if (Object.values(e).some(Boolean)) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep((s) => (Math.min(6, s + 1) as 1 | 2 | 3 | 4 | 5 | 6));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => (Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5 | 6));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const e = validateStep(5);
    if (Object.values(e).some(Boolean)) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setServerError('');

    const payload = {
      language: lang,
      customerName: form.customerName.trim(),
      customerPhone: normalizePhone(form.countryCode, form.customerPhone),
      customerEmail: form.customerEmail.trim(),
      tripType: form.tripType,
      pickup: {
        type: form.pickup.type,
        locationId: form.pickup.locationId,
        text: form.pickup.text,
      },
      dropoff: {
        type: form.dropoff.type,
        locationId: form.dropoff.locationId,
        text: form.dropoff.text,
      },
      date: form.date,
      time: form.time,
      flightNumber: form.flightNumber,
      ...(form.tripType === 'round_trip'
        ? {
            returnDate: form.returnDate,
            returnTime: form.returnTime,
            returnFlightNumber: form.returnFlightNumber,
            returnPickup: {
              type: form.returnPickup.type,
              locationId: form.returnPickup.locationId,
              text: form.returnPickup.text,
            },
            returnDropoff: {
              type: form.returnDropoff.type,
              locationId: form.returnDropoff.locationId,
              text: form.returnDropoff.text,
            },
          }
        : {
            returnDate: '',
            returnTime: '',
            returnFlightNumber: '',
          }),
      carId: form.carId,
      vehicleClass: selectedQuote?.vehicle_class ?? 'standard',
      passengerCount: form.passengerCount,
      hospitalitySelections: Object.entries(form.hospitalitySelections)
        .filter(([, quantity]) => quantity > 0)
        .map(([optionId, quantity]) => ({
          optionId,
          quantity,
        })),
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      price: displayTotal,
    };

    try {
      const res = await submitBookingRequestAction(payload);
      if (!res.success) {
        setServerError(res.error || t('err.generic'));
        setSubmitting(false);
        return;
      }
      setResult({
        bookingReference: res.data.bookingReference,
        whatsappUrl: res.data.whatsappUrl,
        whatsappDelivered: res.data.whatsappDelivered,
      });
      setStep(6);
      setSubmitting(false);
      if (!res.data.whatsappDelivered) {
        try {
          window.open(res.data.whatsappUrl, '_blank', 'noopener,noreferrer');
        } catch {
          // ignore — manual link available
        }
      }
    } catch {
      setServerError(t('err.generic'));
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setQuotes([]);
    setPricingLoaded(false);
    setRouteKey('');
    setResult(null);
    setStep(1);
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[var(--cms-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/15';
  const compactFieldClass =
    'rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[var(--cms-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--cms-primary)]/15';
  const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';
  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const NextIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // ───────────────────────────────────────────────────────────
  // Success step
  // ───────────────────────────────────────────────────────────
  if (step === 6 && result) {
    return (
      <div className="w-full rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">{t('success.title')}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-600">{t('success.message')}</p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('success.reference')}:
          </span>
          <span dir="ltr" className="font-bold text-[var(--cms-primary)]">
            {result.bookingReference}
          </span>
        </div>
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-start">
          <p className="text-xs font-semibold text-emerald-800">
            {result.whatsappDelivered ? t('success.whatsappAuto') : t('success.whatsappHint')}
          </p>
          {!result.whatsappDelivered && (
            <p className="mt-1 text-xs text-emerald-700">{t('success.popupBlocked')}</p>
          )}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!result.whatsappDelivered && (
            <a
              href={result.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
            >
              <MessageCircle className="h-4 w-4" />
              {t('btn.sendWhatsapp')}
            </a>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('btn.bookAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_20px_55px_rgba(15,23,42,0.08)] sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cms-primary)]/12">
          <Navigation className="h-5 w-5 text-[var(--cms-primary)]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('booking.title')}</h2>
          <p className="text-xs text-slate-500">{t('booking.subtitle')}</p>
        </div>
      </div>

      {/* Stepper */}
      <ol className="mb-5 flex items-center gap-1">
        {STEPS.map((s) => {
          const active = step === s;
          const done = step > s;
          return (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  active
                    ? 'bg-[var(--cms-primary)] text-white'
                    : done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? '✓' : s}
              </div>
              <span
                className={`hidden text-[0.65rem] font-semibold sm:block ${
                  active ? 'text-[var(--cms-primary)]' : 'text-slate-400'
                }`}
              >
                {t(`booking.step.${['', 'customer', 'trip', 'car', 'payment', 'summary'][s]}`)}
              </span>
            </li>
          );
        })}
      </ol>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* ───────── Step 1: Customer ───────── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass} htmlFor="bf-name">
                {t('field.fullName')}
              </label>
              <input
                id="bf-name"
                value={form.customerName}
                onChange={(e) => update('customerName', e.target.value)}
                placeholder={t('field.fullName.placeholder')}
                className={fieldClass}
              />
              {errors.customerName && <FieldError msg={errors.customerName} />}
            </div>

            <div>
              <label className={labelClass} htmlFor="bf-phone">
                {t('field.phone')}
              </label>
              <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2" dir="ltr">
                <select
                  value={form.countryCode}
                  onChange={(e) => update('countryCode', e.target.value)}
                  className={`${compactFieldClass} w-full`}
                  dir="ltr"
                  aria-label={t('field.phone')}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  id="bf-phone"
                  value={form.customerPhone}
                  onChange={(e) => update('customerPhone', e.target.value)}
                  placeholder={t('field.phone.placeholder')}
                  className={fieldClass}
                  inputMode="tel"
                  dir="ltr"
                />
              </div>
              {errors.customerPhone && <FieldError msg={errors.customerPhone} />}
            </div>

            <div>
              <label className={labelClass} htmlFor="bf-email">
                {t('field.email')}
              </label>
              <input
                id="bf-email"
                type="email"
                value={form.customerEmail}
                onChange={(e) => update('customerEmail', e.target.value)}
                placeholder={t('field.email.placeholder')}
                className={fieldClass}
                dir="ltr"
              />
              {errors.customerEmail && <FieldError msg={errors.customerEmail} />}
            </div>
          </div>
        )}

        {/* ───────── Step 2: Trip ───────── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            {/* Trip type */}
            <div>
              <span className={labelClass}>{t('trip.type')}</span>
              <div className="grid grid-cols-2 gap-2">
                {(['one_way', 'round_trip'] as const).map((tt) => (
                  <button
                    key={tt}
                    type="button"
                    onClick={() => setTripType(tt)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                      form.tripType === tt
                        ? 'border-[var(--cms-primary)] bg-[var(--cms-primary)]/10 text-[var(--cms-primary)]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t(tt === 'one_way' ? 'trip.oneWay' : 'trip.roundTrip')}
                  </button>
                ))}
              </div>
            </div>

            <EndpointField
              label={t('trip.from')}
              value={form.pickup}
              onChange={(next) => updateEndpoint('pickup', next)}
              airports={airports}
              cities={cities}
              t={t}
              fieldClass={fieldClass}
              labelClass={labelClass}
              lang={lang}
            />
            <EndpointField
              label={t('trip.to')}
              value={form.dropoff}
              onChange={(next) => updateEndpoint('dropoff', next)}
              airports={airports}
              cities={cities}
              t={t}
              fieldClass={fieldClass}
              labelClass={labelClass}
              lang={lang}
            />
            {errors.pickup && <FieldError msg={errors.pickup} />}
            {errors.dropoff && <FieldError msg={errors.dropoff} />}

            <div>
              <label className={labelClass} htmlFor="bf-passengers">
                {t('trip.passengers')}
              </label>
              <input
                id="bf-passengers"
                type="number"
                min={1}
                max={20}
                value={form.passengerCount}
                onChange={(e) => updatePassengerCount(Number(e.target.value))}
                className={fieldClass}
                dir="ltr"
              />
              {errors.passengerCount && <FieldError msg={errors.passengerCount} />}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="bf-date">
                  {t('trip.date')}
                </label>
                <input
                  id="bf-date"
                  type="date"
                  min={todayString()}
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className={fieldClass}
                />
                {errors.date && <FieldError msg={errors.date} />}
              </div>
              <div>
                <label className={labelClass} htmlFor="bf-time">
                  {t('trip.time')}
                </label>
                <input
                  id="bf-time"
                  type="time"
                  value={form.time}
                  onChange={(e) => update('time', e.target.value)}
                  className={fieldClass}
                  dir="ltr"
                />
                {errors.time && <FieldError msg={errors.time} />}
              </div>
            </div>

            {(involvesAirport || form.flightNumber) && (
              <div>
                <label className={labelClass} htmlFor="bf-flight">
                  {t('trip.flightNumber')}{' '}
                  {involvesAirport && <span className="text-red-600">*</span>}
                </label>
                <input
                  id="bf-flight"
                  value={form.flightNumber}
                  onChange={(e) => update('flightNumber', e.target.value)}
                  placeholder={t('trip.flightNumber.placeholder')}
                  className={fieldClass}
                  dir="ltr"
                />
                {errors.flightNumber && <FieldError msg={errors.flightNumber} />}
              </div>
            )}

            {/* Return leg */}
            {form.tripType === 'round_trip' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-3 text-sm font-bold text-slate-700">{t('trip.returnTitle')}</p>
                <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <EndpointField
                    label={t('trip.from')}
                    value={form.returnPickup}
                    onChange={(next) => updateEndpoint('returnPickup', next)}
                    airports={airports}
                    cities={cities}
                    t={t}
                    fieldClass={fieldClass}
                    labelClass={labelClass}
                    lang={lang}
                  />
                  <EndpointField
                    label={t('trip.to')}
                    value={form.returnDropoff}
                    onChange={(next) => updateEndpoint('returnDropoff', next)}
                    airports={airports}
                    cities={cities}
                    t={t}
                    fieldClass={fieldClass}
                    labelClass={labelClass}
                    lang={lang}
                  />
                </div>
                {errors.returnPickup && <FieldError msg={errors.returnPickup} />}
                {errors.returnDropoff && <FieldError msg={errors.returnDropoff} />}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="bf-rdate">
                      {t('trip.returnDate')}
                    </label>
                    <input
                      id="bf-rdate"
                      type="date"
                      min={form.date || todayString()}
                      value={form.returnDate}
                      onChange={(e) => update('returnDate', e.target.value)}
                      className={fieldClass}
                    />
                    {errors.returnDate && <FieldError msg={errors.returnDate} />}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="bf-rtime">
                      {t('trip.returnTime')}
                    </label>
                    <input
                      id="bf-rtime"
                      type="time"
                      value={form.returnTime}
                      onChange={(e) => update('returnTime', e.target.value)}
                      className={fieldClass}
                      dir="ltr"
                    />
                    {errors.returnTime && <FieldError msg={errors.returnTime} />}
                  </div>
                </div>
                {returnInvolvesAirport && (
                  <div className="mt-3">
                    <label className={labelClass} htmlFor="bf-rflight">
                      {t('trip.returnFlight')}
                      <span className="text-red-600"> *</span>
                    </label>
                    <input
                      id="bf-rflight"
                      value={form.returnFlightNumber}
                      onChange={(e) => update('returnFlightNumber', e.target.value)}
                      placeholder={t('trip.flightNumber.placeholder')}
                      className={fieldClass}
                      dir="ltr"
                    />
                    {errors.returnFlightNumber && <FieldError msg={errors.returnFlightNumber} />}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ───────── Step 3: Car ───────── */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">{t('car.title')}</h3>
            {!routeReady && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                {t('err.from')} / {t('err.to')}
              </div>
            )}
            {routeReady && pricingLoading && (
              <p className="text-sm text-slate-500">{lang === 'ar' ? 'جاري تحميل الأسعار...' : 'Loading prices...'}</p>
            )}
            {routeReady && !pricingLoading && availableQuotes.length === 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                {effectiveQuotes.some((q) => q.available)
                  ? lang === 'ar'
                    ? `لا توجد سيارة متاحة تسع ${form.passengerCount} راكبًا على هذا المسار.`
                    : `No available car fits ${form.passengerCount} passengers on this route.`
                  : t('car.noPricing')}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableQuotes.map((q) => {
                const selected = form.carId === q.car.id;
                const price = q.price * roundTripMultiplier;
                return (
                  <button
                    key={q.car.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        carId: q.car.id,
                        hospitalitySelections: q.car.hospitality_enabled ? prev.hospitalitySelections : {},
                      }));
                      setErrors((prev) => ({ ...prev, carId: '', hospitalitySelections: '', general: '' }));
                      setServerError('');
                    }}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-start transition ${
                      selected
                        ? 'border-[var(--cms-primary)] bg-[var(--cms-primary)]/8 ring-2 ring-[var(--cms-primary)]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--cms-primary)]/10">
                      <CarIcon className="h-5 w-5 text-[var(--cms-primary)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {lang === 'ar' ? q.car.name_ar : q.car.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {q.car.passenger_capacity} {t('car.passengers')} · {q.car.luggage_capacity}{' '}
                        {t('car.luggage')}
                      </p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {price} <span className="text-xs font-semibold">{lang === 'ar' ? 'ريال' : 'SAR'}</span>
                      </p>
                    </div>
                    {selected && (
                      <span className="shrink-0 rounded-full bg-[var(--cms-primary)] px-2 py-0.5 text-[0.65rem] font-bold text-white">
                        {t('car.selected')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {errors.carId && <FieldError msg={errors.carId} />}
            {selectedQuote && form.tripType === 'round_trip' && (
              <p className="text-xs text-slate-500">{t('summary.roundTripNote')}</p>
            )}
          </div>
        )}

        {/* ───────── Step 4: Payment ───────── */}
        {step === 4 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">{t('payment.title')}</h3>

            {hospitalityAvailable && hospitalityOptions.length > 0 && (
              <div className="rounded-2xl border border-[var(--cms-primary)]/15 bg-[var(--cms-primary)]/5 p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--cms-primary)] shadow-sm">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t('hospitality.title')}</h4>
                    <p className="text-xs text-slate-600">{t('hospitality.subtitle')}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {hospitalityOptions.map((option) => {
                    const quantity = form.hospitalitySelections[option.id] ?? 0;
                    return (
                      <div
                        key={option.id}
                        className="flex flex-col gap-3 rounded-xl border border-white/80 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {lang === 'ar' ? option.name_ar : option.name}
                          </p>
                          <p className="text-xs text-emerald-700">{t('hospitality.free')}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateHospitalityQuantity(option.id, quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={form.passengerCount}
                            value={quantity}
                            onChange={(e) =>
                              updateHospitalityQuantity(option.id, Number(e.target.value))
                            }
                            className="h-9 w-20 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm font-semibold text-slate-900 focus:border-[var(--cms-primary)] focus:outline-none"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => updateHospitalityQuantity(option.id, quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-xs text-slate-500">{t('hospitality.limit')}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              {PAYMENT_OPTIONS.map(({ value, icon: Icon, labelKey, descKey }) => {
                const selected = form.paymentMethod === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('paymentMethod', value)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-start transition ${
                      selected
                        ? 'border-[var(--cms-primary)] bg-[var(--cms-primary)]/8 ring-2 ring-[var(--cms-primary)]/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${selected ? 'text-[var(--cms-primary)]' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{t(labelKey)}</p>
                      <p className="text-xs text-slate-500">{t(descKey)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && <FieldError msg={errors.paymentMethod} />}

            <BankDetailsCard visible={form.paymentMethod === 'bank_transfer'} t={t} />

            <div>
              <label className={labelClass} htmlFor="bf-notes">
                {t('field.notes')}
              </label>
              <textarea
                id="bf-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder={t('field.notes.placeholder')}
                className={fieldClass}
              />
            </div>
          </div>
        )}

        {/* ───────── Step 5: Summary ───────── */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-base font-bold text-slate-800">{t('summary.title')}</h3>
            <SummaryRow label={t('trip.type')} value={t(form.tripType === 'one_way' ? 'trip.oneWay' : 'trip.roundTrip')} />
            <SummaryRow label={t('trip.from')} value={endpointDisplay(form.pickup, locations, lang)} />
            <SummaryRow label={t('trip.to')} value={endpointDisplay(form.dropoff, locations, lang)} />
            <SummaryRow label={t('trip.date')} value={`${form.date} · ${form.time}`} dir="ltr" />
            {involvesAirport && form.flightNumber && (
              <SummaryRow label={t('trip.flightNumber')} value={form.flightNumber} dir="ltr" />
            )}
            {form.tripType === 'round_trip' && (
              <>
                <SummaryRow
                  label={lang === 'ar' ? 'مسار العودة' : 'Return Route'}
                  value={`${endpointDisplay(form.returnPickup, locations, lang)} → ${endpointDisplay(form.returnDropoff, locations, lang)}`}
                />
                <SummaryRow
                  label={t('trip.returnDate')}
                  value={`${form.returnDate} · ${form.returnTime}`}
                  dir="ltr"
                />
              </>
            )}
            {form.tripType === 'round_trip' && returnInvolvesAirport && form.returnFlightNumber && (
              <SummaryRow label={t('trip.returnFlight')} value={form.returnFlightNumber} dir="ltr" />
            )}
            <SummaryRow
              label={t('summary.car')}
              value={
                selectedQuote
                  ? `${lang === 'ar' ? selectedQuote.car.name_ar : selectedQuote.car.name}`
                  : '-'
              }
            />
            <SummaryRow label={t('trip.passengers')} value={String(form.passengerCount)} dir="ltr" />
            <SummaryRow
              label={t('hospitality.title')}
              value={
                hospitalitySummary.length > 0
                  ? hospitalitySummary.map((item) => `${item.label} x${item.quantity}`).join(', ')
                  : t('hospitality.none')
              }
            />
            <SummaryRow label={t('summary.payment')} value={paymentLabel(form.paymentMethod, lang)} />
            <SummaryRow
              label={t('summary.total')}
              value={`${displayTotal} ${lang === 'ar' ? 'ريال' : 'SAR'}`}
              strong
              dir="ltr"
            />
            <SummaryRow label={t('field.fullName')} value={form.customerName} />
            <SummaryRow label={t('field.phone')} value={normalizePhone(form.countryCode, form.customerPhone)} dir="ltr" />
            {form.customerEmail && <SummaryRow label={t('field.email')} value={form.customerEmail} dir="ltr" />}

            {serverError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-xs text-red-700">{serverError}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer nav */}
        {step < 6 && (
          <div className="mt-1 flex items-center justify-between gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <BackIcon className="h-4 w-4" />
                {t('btn.back')}
              </button>
            ) : (
              <span />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold"
              >
                {t('btn.next')}
                <NextIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {submitting ? '...' : t('btn.submit')}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="h-3 w-3" />
      {msg}
    </p>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  dir,
}: {
  label: string;
  value: string;
  strong?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span
        dir={dir}
        className={`text-start text-sm ${strong ? 'font-bold text-emerald-700' : 'font-semibold text-slate-900'}`}
      >
        {value}
      </span>
    </div>
  );
}

function paymentLabel(method: PaymentMethod, lang: 'ar' | 'en'): string {
  const map: Record<PaymentMethod, { ar: string; en: string }> = {
    cash: { ar: 'نقدًا', en: 'Cash' },
    card_pos: { ar: 'بطاقة / نقاط بيع', en: 'Card / POS' },
    bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  };
  return map[method][lang];
}

function locationDisplayName(location: Location | undefined, lang: 'ar' | 'en'): string {
  if (!location) return '';
  return lang === 'ar' ? location.name_ar || location.name : location.name;
}

function endpointDisplay(
  endpoint: EndpointState,
  locations: Location[],
  lang: 'ar' | 'en',
): string {
  const loc = locations.find((l) => l.id === endpoint.locationId);
  const name = locationDisplayName(loc, lang);
  const detail = endpoint.text?.trim();
  if (detail && detail !== name) return `${name} — ${detail}`;
  return name || (lang === 'ar' ? '—' : '—');
}

interface EndpointFieldProps {
  label: string;
  value: EndpointState;
  onChange: (next: Partial<EndpointState>) => void;
  airports: Location[];
  cities: Location[];
  t: (key: string) => string;
  fieldClass: string;
  labelClass: string;
  lang: 'ar' | 'en';
}

function EndpointField({
  label,
  value,
  onChange,
  airports,
  cities,
  t,
  fieldClass,
  labelClass,
  lang,
}: EndpointFieldProps) {
  const isAirport = value.type === 'airport';
  const showText = true;
  const selectOptions = isAirport ? airports : cities;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>

      {/* Type selector */}
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {ENDPOINT_TYPES.map(({ value: tv, icon: Icon, labelKey }) => {
          const selected = value.type === tv;
          return (
            <button
              key={tv}
              type="button"
              onClick={() => onChange({ type: tv, locationId: '', text: '' })}
              className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[0.7rem] font-semibold transition ${
                selected
                  ? 'border-[var(--cms-primary)] bg-[var(--cms-primary)]/10 text-[var(--cms-primary)]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </button>
          );
        })}
      </div>

      {/* Location select */}
      <div className="mb-2">
        <span className={`${labelClass} text-xs`}>{isAirport ? t('loc.selectAirport') : t('loc.routeCity')}</span>
        <select
          value={value.locationId}
          onChange={(e) => {
            onChange({ locationId: e.target.value });
          }}
          className={fieldClass}
        >
          <option value="">
            {isAirport ? t('loc.selectAirport') : t('loc.routeCity')}
          </option>
          {selectOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {locationDisplayName(l, lang)}
            </option>
          ))}
        </select>
      </div>

      {/* Detail text */}
      {showText && (
        <div>
          <span className={`${labelClass} text-xs`}>
            {value.type === 'airport' && t('loc.airportOther')}
            {value.type === 'hotel' && t('loc.hotelName')}
            {value.type === 'address' && t('loc.type.address')}
            {value.type === 'other' && t('loc.detail')}
          </span>
          <input
            value={value.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder={
              value.type === 'hotel'
                ? t('loc.hotelName.placeholder')
                : value.type === 'address'
                  ? t('loc.address.placeholder')
                  : value.type === 'airport'
                    ? t('loc.airportDetail.placeholder')
                    : ''
            }
            className={fieldClass}
          />
        </div>
      )}
    </div>
  );
}

function BankDetailsCard({ visible, t }: { visible: boolean; t: (key: string) => string }) {
  const [details, setDetails] = useState<{
    bank_name: string;
    account_holder_name: string;
    iban: string;
    bank_qr_url: string | null;
    accounts: BankAccount[];
  } | null>(null);

  useEffect(() => {
    if (!visible || details) return;
    let active = true;
    (async () => {
      const res = await getPublicBankDetailsAction();
      if (!active) return;
      setDetails(res);
    })();
    return () => {
      active = false;
    };
  }, [visible, details]);

  if (!visible) return null;

  const accounts =
    details?.accounts.length
      ? details.accounts
      : details
        ? [
            {
              id: 'legacy-bank-details',
              bank_name: details.bank_name,
              account_holder_name: details.account_holder_name,
              iban: details.iban,
              qr_url: details.bank_qr_url,
              sort_order: 0,
              is_active: true,
              created_at: '',
              updated_at: '',
            } satisfies BankAccount,
          ]
        : [];

  return (
    <div className="rounded-xl border border-[var(--cms-primary)]/25 bg-[var(--cms-primary)]/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Landmark className="h-4 w-4 text-[var(--cms-primary)]" />
        <p className="text-sm font-bold text-slate-800">{t('payment.bank_transfer')}</p>
      </div>
      {details ? (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <dl className="space-y-1.5">
                {[
                  { label: t('payment.bank.name'), value: account.bank_name },
                  { label: t('payment.bank.holder'), value: account.account_holder_name },
                  { label: t('payment.bank.iban'), value: account.iban },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="text-xs font-semibold text-slate-500">{row.label}</dt>
                    <dd dir="ltr" className="text-start text-sm font-bold text-slate-900">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {account.qr_url && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">{t('payment.bank.qr')}</p>
                  <img
                    src={account.qr_url}
                    alt={t('payment.bank.qr')}
                    className="mx-auto h-32 w-32 rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">...</p>
      )}
      <p className="mt-2 text-xs text-slate-600">{t('payment.bank.note')}</p>
    </div>
  );
}
