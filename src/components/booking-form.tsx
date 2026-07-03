'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle,
  ChevronLeft,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  Users,
} from 'lucide-react';
import type { Location, PricingRule } from '@/types';
import {
  createBookingAction,
  getActiveLocationsAction,
  getRoutePricingAction,
} from '@/app/(customer)/actions';

type Step = 1 | 2 | 3 | 4;

interface BookingFormState {
  pickupLocationId: string;
  destinationLocationId: string;
  tripDateTime: string;
  vehicleClass: 'standard' | 'executive' | 'van';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const VEHICLE_OPTIONS = [
  {
    id: 'standard' as const,
    label: 'عادية',
    desc: 'سيارة مريحة تناسب حتى 3 ركاب',
    icon: Car,
  },
  {
    id: 'executive' as const,
    label: 'تنفيذية',
    desc: 'خيار راقٍ لرحلات الأعمال والاستقبال الرسمي',
    icon: Star,
  },
  {
    id: 'van' as const,
    label: 'فان',
    desc: 'مساحة أكبر للمجموعات والحقائب الإضافية',
    icon: Users,
  },
];

const VEHICLE_CLASS_LABELS: Record<BookingFormState['vehicleClass'], string> = {
  standard: 'عادية',
  executive: 'تنفيذية',
  van: 'فان',
};

const STEP_LABELS = [
  { value: 1 as const, label: 'المسار' },
  { value: 2 as const, label: 'الفئة' },
  { value: 3 as const, label: 'البيانات' },
];

const STEP_NOTES: Record<Exclude<Step, 4>, { title: string; description: string }> = {
  1: {
    title: 'اختر تفاصيل الرحلة',
    description: 'حدد نقطة الانطلاق والوجهة ووقت السفر المناسب حتى نعرض لك الخدمة بدقة.',
  },
  2: {
    title: 'راجع الفئات المتاحة',
    description: 'قارن السعر بوضوح واختر السيارة التي تناسب المسافر أو المجموعة.',
  },
  3: {
    title: 'أدخل بيانات التواصل',
    description: 'أرسل طلب الحجز وسيتابع فريق التشغيل التأكيد معك مباشرة.',
  },
};

const EMPTY_FORM: BookingFormState = {
  pickupLocationId: '',
  destinationLocationId: '',
  tripDateTime: '',
  vehicleClass: 'standard',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
};

const currencyFormatter = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatPrice(price: number) {
  return currencyFormatter.format(price);
}

function formatLocationType(type?: string) {
  if (type === 'airport') return 'مطار';
  if (type === 'city') return 'مدينة';
  return type ?? '';
}

function getMinTripDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function BookingForm() {
  const [step, setStep] = useState<Step>(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [form, setForm] = useState<BookingFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [successBooking, setSuccessBooking] = useState<{ referenceId: string } | null>(null);

  useEffect(() => {
    getActiveLocationsAction().then((res) => {
      if (res.success) {
        setLocations(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!form.pickupLocationId || !form.destinationLocationId) {
      return;
    }

    getRoutePricingAction(form.pickupLocationId, form.destinationLocationId).then((res) => {
      if (res.success) {
        setPricingRules(res.data);
      } else {
        setPricingRules([]);
      }
    });
  }, [form.destinationLocationId, form.pickupLocationId]);

  const selectedPickup = locations.find((location) => location.id === form.pickupLocationId);
  const selectedDestination = locations.find(
    (location) => location.id === form.destinationLocationId
  );
  const resolvedVehicleClass =
    pricingRules.some((rule) => rule.vehicle_class === form.vehicleClass)
      ? form.vehicleClass
      : pricingRules.find(
          (rule): rule is PricingRule & {
            vehicle_class: BookingFormState['vehicleClass'];
          } =>
            rule.vehicle_class === 'standard' ||
            rule.vehicle_class === 'executive' ||
            rule.vehicle_class === 'van'
        )?.vehicle_class ?? form.vehicleClass;
  const selectedPricing = pricingRules.find(
    (rule) => rule.vehicle_class === resolvedVehicleClass
  );
  const activeStep = step === 4 ? 3 : step;

  const updateField = (field: keyof BookingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '', _general: '' }));
  };

  const handlePickupChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      pickupLocationId: value,
      destinationLocationId:
        prev.destinationLocationId === value ? '' : prev.destinationLocationId,
    }));
    setPricingRules([]);
    setErrors((prev) => ({ ...prev, pickupLocationId: '', destinationLocationId: '' }));
  };

  const handleDestinationChange = (value: string) => {
    setForm((prev) => ({ ...prev, destinationLocationId: value }));
    setPricingRules([]);
    setErrors((prev) => ({ ...prev, destinationLocationId: '' }));
  };

  const handleReset = () => {
    setStep(1);
    setSuccessBooking(null);
    setPricingRules([]);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createBookingAction({
        ...form,
        vehicleClass: resolvedVehicleClass,
        tripDateTime: new Date(form.tripDateTime).toISOString(),
      });

      if (result.success) {
        setSuccessBooking({ referenceId: result.data.reference_id });
        setStep(4);
        return;
      }

      const fieldErrors: Record<string, string> = {};
      if (result.validationErrors) {
        Object.entries(result.validationErrors).forEach(([key, messages]) => {
          fieldErrors[key] = messages[0];
        });
      } else {
        fieldErrors._general = result.error;
      }
      setErrors(fieldErrors);
    });
  };

  if (step === 4 && successBooking) {
    return (
      <div className="glass overflow-hidden rounded-[32px] border border-white/40 glow">
        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/14">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="mt-6 text-4xl font-semibold text-slate-950">تم استلام طلب الحجز</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              وصلت تفاصيل الرحلة إلى فريق التشغيل، وسيتم تأكيد النقل معك في أقرب وقت.
            </p>

            <div className="panel-card mt-8 px-6 py-5">
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-500">
                الرقم المرجعي للحجز
              </p>
              <p className="gradient-text mt-3 break-all text-3xl font-semibold" dir="ltr">
                {successBooking.referenceId}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                احتفظ بهذا الرقم للمتابعة عند الحاجة أو عند التواصل مع الفريق.
              </p>
            </div>

            <div className="soft-card mt-6 p-5 text-right">
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                ماذا يحدث بعد ذلك
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                يراجع الفريق تفاصيل الرحلة ويتأكد من التوفر ثم يتواصل مباشرة مع المسافر أو
                جهة الحجز عبر البيانات المرسلة.
              </p>
            </div>

            <button
              id="book-another-btn"
              onClick={handleReset}
              className="btn-primary mt-8 inline-flex w-full px-6 py-4 text-sm font-semibold"
            >
              احجز رحلة أخرى
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-[18px] border border-slate-200/80 shadow-none sm:rounded-[32px] sm:border-white/40 sm:shadow-[var(--cms-shadow)]">
      <div className="border-b-0 border-slate-200 px-3 pb-3 pt-0 sm:border-b sm:px-8 sm:py-6">
        <div className="flex flex-col gap-3 sm:gap-5">
            <div className="flex flex-row-reverse items-center justify-between gap-3 sm:flex-row sm:items-start">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-500">الحجز</p>
              <h2 className="mt-1 text-3xl font-semibold text-slate-950">
                احجز رحلتك في ثلاث خطوات واضحة
              </h2>
            </div>
            <div className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              الخطوة {activeStep} من 3
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {STEP_LABELS.map((item) => {
              const isActive = activeStep === item.value;
              const isComplete = activeStep > item.value;

              return (
                <button
                  key={item.label}
                  id={`step-${item.value}-tab`}
                  onClick={() => activeStep > item.value && setStep(item.value)}
                  className={`min-w-0 rounded-xl border px-2 py-2.5 text-center sm:px-4 sm:py-4 sm:text-right ${
                    isActive
                      ? 'border-[var(--cms-primary)]/30 bg-[var(--cms-primary)]/8'
                      : isComplete
                        ? 'border-slate-200 bg-white hover:border-[var(--cms-primary)]/20'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 sm:justify-start sm:gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-9 sm:w-9 sm:text-sm ${
                        isActive
                          ? 'bg-[var(--cms-primary)] text-white'
                          : isComplete
                            ? 'bg-emerald-500 text-white'
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
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-950">{STEP_NOTES[step].title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{STEP_NOTES[step].description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-8">
        {step === 1 && (
          <div className="space-y-6">
            {locations.length === 0 && (
              <div className="hidden rounded-xl border border-amber-200 bg-amber-50 p-4 sm:block">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-100 p-2.5">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      لم يتم إعداد المواقع بعد
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      أضف نقاط الانطلاق والأسعار من لوحة الإدارة، أو استخدم صفحة التواصل
                      لاستقبال الطلبات يدويًا مؤقتًا.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href="/contact" className="btn-secondary inline-flex px-4 py-3 text-sm font-semibold">
                        تواصل معنا
                      </Link>
                      <Link href="/admin/login" className="btn-primary inline-flex px-4 py-3 text-sm font-semibold">
                        افتح الإدارة
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="pickup-location">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--cms-primary)]" />
                    نقطة الانطلاق
                  </span>
                </label>
                <select
                  id="pickup-location"
                  value={form.pickupLocationId}
                  onChange={(event) => handlePickupChange(event.target.value)}
                  className="input-shell text-sm"
                >
                  <option value="">اختر نقطة الانطلاق...</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({formatLocationType(location.type)})
                    </option>
                  ))}
                </select>
                {errors.pickupLocationId && (
                  <p className="mt-2 text-xs text-red-500">{errors.pickupLocationId}</p>
                )}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="destination-location"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--cms-secondary)]" />
                    الوجهة
                  </span>
                </label>
                <select
                  id="destination-location"
                  value={form.destinationLocationId}
                  onChange={(event) => handleDestinationChange(event.target.value)}
                  className="input-shell text-sm"
                >
                  <option value="">اختر الوجهة...</option>
                  {locations
                    .filter((location) => location.id !== form.pickupLocationId)
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({formatLocationType(location.type)})
                      </option>
                    ))}
                </select>
                {errors.destinationLocationId && (
                  <p className="mt-2 text-xs text-red-500">{errors.destinationLocationId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="trip-datetime">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--cms-primary)]" />
                  تاريخ ووقت الرحلة
                </span>
              </label>
              <input
                id="trip-datetime"
                type="datetime-local"
                min={getMinTripDateTime()}
                value={form.tripDateTime}
                onChange={(event) => updateField('tripDateTime', event.target.value)}
                className="input-shell text-sm"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                اختر وقتًا بعد ساعة واحدة على الأقل حتى يتمكن الفريق من تأكيد الرحلة.
              </p>
              {errors.tripDateTime && (
                <p className="mt-2 text-xs text-red-500">{errors.tripDateTime}</p>
              )}
            </div>

            {(selectedPickup || selectedDestination || form.tripDateTime) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-slate-600">
                هل تحتاج مسارًا خاصًا أو عرض سعر يدوي؟
                <Link href="/contact" className="mr-1 font-semibold text-slate-950 underline">
                  استخدم نموذج التواصل
                </Link>
                .
              </p>
              <button
                id="step1-next-btn"
                onClick={() => {
                  if (!form.pickupLocationId) {
                    setErrors({ pickupLocationId: 'يرجى اختيار نقطة الانطلاق.' });
                    return;
                  }
                  if (!form.destinationLocationId) {
                    setErrors({ destinationLocationId: 'يرجى اختيار الوجهة.' });
                    return;
                  }
                  if (!form.tripDateTime) {
                    setErrors({ tripDateTime: 'يرجى اختيار التاريخ والوقت.' });
                    return;
                  }
                  setErrors({});
                  setStep(2);
                }}
                disabled={locations.length === 0}
                className="btn-primary inline-flex w-full px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
              >
                متابعة إلى الفئات
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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
                    className={`rounded-xl border p-5 text-right sm:flex sm:items-center sm:justify-between ${
                      pricing
                        ? isSelected
                          ? 'border-[var(--cms-primary)]/40 bg-[var(--cms-primary)]/6'
                          : 'border-slate-200 hover:border-slate-300'
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80">
                        <Icon className="h-5 w-5 text-[var(--cms-primary)]" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-slate-950">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">
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
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                      السعر التقديري
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      سعر واضح وثابت يساعد العميل على فهم الحجز مباشرة.
                    </p>
                  </div>
                  <p className="text-3xl font-semibold text-emerald-600" dir="ltr">
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {errors._general && (
              <div className="panel-card px-5 py-4 text-sm text-red-500">{errors._general}</div>
            )}

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
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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
                        <span className="text-2xl font-semibold text-emerald-600" dir="ltr">
                          {selectedPricing ? formatPrice(Number(selectedPricing.price)) : 'قيد التحديد'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
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
    </div>
  );
}
