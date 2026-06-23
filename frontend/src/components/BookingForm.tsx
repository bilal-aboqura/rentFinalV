import { useEffect, useMemo, useState } from 'react';
import type { BookingPayload, LocationDTO, VehicleClass } from '../types';
import { Button, Field, Input, Select } from './ui';

const VEHICLE_OPTIONS: { value: VehicleClass; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'executive', label: 'Executive' },
  { value: 'van', label: 'Van' },
];

interface BookingFormProps {
  locations: LocationDTO[];
  onQuote: (params: {
    pickupLocationId: number;
    destinationLocationId: number;
    vehicleClass: VehicleClass;
  }) => Promise<number | null>;
  onSubmit: (payload: BookingPayload) => Promise<{ reference_id: string }>;
}

interface FormErrors {
  pickup?: string;
  destination?: string;
  vehicle?: string;
  tripDateTime?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export function BookingForm({ locations, onQuote, onSubmit }: BookingFormProps) {
  const [pickupId, setPickupId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [vehicleClass, setVehicleClass] = useState<VehicleClass | ''>('');
  const [tripDateTime, setTripDateTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [price, setPrice] = useState<number | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ reference_id: string } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const routeReady =
    pickupId !== '' && destinationId !== '' && vehicleClass !== '' && pickupId !== destinationId;

  useEffect(() => {
    let active = true;
    if (!routeReady) {
      setPrice(null);
      return;
    }
    setQuoteLoading(true);
    onQuote({
      pickupLocationId: Number(pickupId),
      destinationLocationId: Number(destinationId),
      vehicleClass: vehicleClass as VehicleClass,
    })
      .then((value) => {
        if (active) setPrice(value);
      })
      .catch(() => {
        if (active) setPrice(null);
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pickupId, destinationId, vehicleClass, routeReady, onQuote]);

  const totalDisplay = useMemo(() => (price !== null ? `$${price.toFixed(2)}` : null), [price]);

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!pickupId) next.pickup = 'Select a pickup location.';
    if (!destinationId) next.destination = 'Select a destination.';
    if (pickupId && destinationId && pickupId === destinationId) {
      next.destination = 'Destination must differ from pickup.';
    }
    if (!vehicleClass) next.vehicle = 'Select a vehicle class.';
    if (!tripDateTime) next.tripDateTime = 'Choose a trip date and time.';
    else if (new Date(tripDateTime).getTime() <= Date.now()) {
      next.tripDateTime = 'Trip must be in the future.';
    }
    if (!name.trim()) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.';
    if (!phone.trim()) next.phone = 'Enter a phone number.';
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await onSubmit({
        pickup_location_id: Number(pickupId),
        destination_location_id: Number(destinationId),
        trip_date_time: new Date(tripDateTime).toISOString(),
        vehicle_class: vehicleClass as VehicleClass,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
      });
      setConfirmation({ reference_id: result.reference_id });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit booking.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div data-testid="booking-confirmation" className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <h3 className="text-xl font-bold text-green-800">Booking confirmed!</h3>
        <p className="mt-2 text-slate-700">Your booking reference is</p>
        <p className="mt-1 text-2xl font-bold tracking-wider text-brand-700">{confirmation.reference_id}</p>
        <p className="mt-4 text-sm text-slate-500">We have received your request and will confirm shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Pickup location" htmlFor="pickup-location" required error={errors.pickup}>
          <Select
            id="pickup-location"
            value={pickupId}
            onChange={(e) => setPickupId(e.target.value)}
            aria-invalid={!!errors.pickup}
          >
            <option value="">Select pickup</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Destination" htmlFor="destination" required error={errors.destination}>
          <Select
            id="destination"
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            aria-invalid={!!errors.destination}
          >
            <option value="">Select destination</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Vehicle class" htmlFor="vehicle-class" required error={errors.vehicle}>
          <Select
            id="vehicle-class"
            value={vehicleClass}
            onChange={(e) => setVehicleClass(e.target.value as VehicleClass | '')}
          >
            <option value="">Select vehicle</option>
            {VEHICLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trip date & time" htmlFor="trip-date-time" required error={errors.tripDateTime}>
          <Input
            id="trip-date-time"
            type="datetime-local"
            value={tripDateTime}
            onChange={(e) => setTripDateTime(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Full name" htmlFor="customer-name" required error={errors.name}>
          <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="customer-email" required error={errors.email}>
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" htmlFor="customer-phone" required error={errors.phone}>
          <Input
            id="customer-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </Field>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
        <div className="text-sm text-slate-600">
          {quoteLoading && <span>Calculating price…</span>}
          {!quoteLoading && totalDisplay && (
            <span>
              Estimated price: <strong className="text-base text-slate-900">{totalDisplay}</strong>
            </span>
          )}
        </div>
        <Button type="submit" loading={submitting} className="w-full sm:w-auto">
          Book transfer
        </Button>
      </div>

      {(Object.keys(errors).length > 0 || submitError) && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {submitError || 'Please fix the highlighted fields before submitting.'}
        </div>
      )}
    </form>
  );
}
