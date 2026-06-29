import { useState, useEffect, type FormEvent } from 'react';
import { Bus } from 'lucide-react';

export interface LocationOption {
  id: number;
  name: string;
  type: 'city' | 'airport';
}

export type VehicleClass = 'standard' | 'executive' | 'van';

export interface BookingPayload {
  pickup_location_id: number;
  destination_location_id: number;
  trip_date_time: string;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface BookingResult {
  reference_id: string;
}

interface BookingFormProps {
  locations: LocationOption[];
  onSubmit: (payload: BookingPayload) => Promise<BookingResult>;
  onFetchPrice?: (
    pickup: number,
    destination: number,
    vehicle: VehicleClass,
  ) => Promise<number | null>;
}

interface FormState {
  pickup_location_id: string;
  destination_location_id: string;
  trip_date_time: string;
  vehicle_class: VehicleClass;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

type Errors = Partial<Record<keyof FormState | 'general', string>>;

const VEHICLE_OPTIONS: { value: VehicleClass; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'executive', label: 'Executive' },
  { value: 'van', label: 'Van' },
];

const emptyForm: FormState = {
  pickup_location_id: '',
  destination_location_id: '',
  trip_date_time: '',
  vehicle_class: 'standard',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
};

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.customer_name.trim()) errors.customer_name = 'Name is required.';
  if (!form.customer_email.trim()) {
    errors.customer_email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
    errors.customer_email = 'Enter a valid email address.';
  }
  if (!form.customer_phone.trim()) errors.customer_phone = 'Phone is required.';
  if (!form.trip_date_time) {
    errors.trip_date_time = 'Date and time are required.';
  } else if (new Date(form.trip_date_time).getTime() <= Date.now()) {
    errors.trip_date_time = 'Trip date must be in the future.';
  }
  if (
    form.pickup_location_id &&
    form.destination_location_id &&
    form.pickup_location_id === form.destination_location_id
  ) {
    errors.destination_location_id = 'Pickup and destination must be different.';
  }
  if (!form.pickup_location_id) errors.pickup_location_id = 'Select a pickup location.';
  if (!form.destination_location_id) {
    errors.destination_location_id = 'Select a destination.';
  }
  return errors;
}

export function BookingForm({ locations, onSubmit, onFetchPrice }: BookingFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  const pickupId = Number(form.pickup_location_id);
  const destinationId = Number(form.destination_location_id);

  useEffect(() => {
    let active = true;
    if (
      onFetchPrice &&
      pickupId &&
      destinationId &&
      pickupId !== destinationId
    ) {
      onFetchPrice(pickupId, destinationId, form.vehicle_class)
        .then((p) => {
          if (active) setPrice(p);
        })
        .catch(() => {
          if (active) setPrice(null);
        });
    } else {
      setPrice(null);
    }
    return () => {
      active = false;
    };
  }, [pickupId, destinationId, form.vehicle_class, onFetchPrice]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setResult(null);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await onSubmit({
        pickup_location_id: pickupId,
        destination_location_id: destinationId,
        trip_date_time: new Date(form.trip_date_time).toISOString(),
        vehicle_class: form.vehicle_class,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
      });
      setResult(res);
      setForm(emptyForm);
      setPrice(null);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Failed to submit booking.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div
        className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200"
        data-testid="booking-success"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Bus className="h-7 w-7" />
        </div>
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Booking Confirmed
        </h2>
        <p className="mt-2 text-center text-slate-600">
          Your booking reference is
        </p>
        <p className="mt-1 text-center text-3xl font-extrabold tracking-wide text-brand-600">
          {result.reference_id}
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700"
          onClick={() => setResult(null)}
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8"
      noValidate
    >
      <h2 className="text-xl font-bold text-slate-900">Book Your Airport Transfer</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pickup" error={errors.pickup_location_id}>
          <select
            className={inputClass(errors.pickup_location_id)}
            value={form.pickup_location_id}
            onChange={(e) => update('pickup_location_id', e.target.value)}
          >
            <option value="">Select pickup</option>
            {locations.map((loc) => (
              <option key={loc.id} value={String(loc.id)}>
                {loc.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Destination" error={errors.destination_location_id}>
          <select
            className={inputClass(errors.destination_location_id)}
            value={form.destination_location_id}
            onChange={(e) => update('destination_location_id', e.target.value)}
          >
            <option value="">Select destination</option>
            {locations.map((loc) => (
              <option key={loc.id} value={String(loc.id)}>
                {loc.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Trip Date & Time" error={errors.trip_date_time}>
          <input
            type="datetime-local"
            className={inputClass(errors.trip_date_time)}
            value={form.trip_date_time}
            onChange={(e) => update('trip_date_time', e.target.value)}
          />
        </Field>

        <Field label="Vehicle Class" error={undefined}>
          <select
            className={inputClass(undefined)}
            value={form.vehicle_class}
            onChange={(e) =>
              update('vehicle_class', e.target.value as VehicleClass)
            }
          >
            {VEHICLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {price !== null && (
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          Estimated price: <span className="font-bold">${price.toFixed(2)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Full Name" error={errors.customer_name}>
          <input
            type="text"
            className={inputClass(errors.customer_name)}
            value={form.customer_name}
            onChange={(e) => update('customer_name', e.target.value)}
          />
        </Field>
        <Field label="Email" error={errors.customer_email}>
          <input
            type="email"
            className={inputClass(errors.customer_email)}
            value={form.customer_email}
            onChange={(e) => update('customer_email', e.target.value)}
          />
        </Field>
        <Field label="Phone" error={errors.customer_phone}>
          <input
            type="tel"
            className={inputClass(errors.customer_phone)}
            value={form.customer_phone}
            onChange={(e) => update('customer_phone', e.target.value)}
          />
        </Field>
      </div>

      {errors.general && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {errors.general}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Book Now'}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputClass(error?: string): string {
  const base =
    'w-full rounded-lg border bg-white px-3 py-2 text-slate-900 outline-none transition focus:ring-2 focus:ring-brand-400';
  return error
    ? `${base} border-red-400`
    : `${base} border-slate-300`;
}
