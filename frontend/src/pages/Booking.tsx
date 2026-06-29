import { useEffect, useState } from 'react';
import { BookingForm } from '../components/BookingForm';
import type { BookingPayload, BookingResult, LocationOption, VehicleClass } from '../components/BookingForm';
import { fetchLocations, type Location } from '../services/locations';
import { createBooking, getPriceQuote } from '../services/bookings';
import { fetchFaq, type FaqItem } from '../services/content';

interface ParsedFaq {
  question: string;
  answer: string;
}

export function BookingPage() {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [faq, setFaq] = useState<ParsedFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchLocations(), fetchFaq().catch(() => [] as FaqItem[])])
      .then(([data, faqItems]) => {
        if (!active) return;
        setLocations(
          data.map((l: Location) => ({ id: l.id, name: l.name, type: l.type })),
        );
        setFaq(
          faqItems
            .map((item) => {
              try {
                return JSON.parse(item.value) as ParsedFaq;
              } catch {
                return null;
              }
            })
            .filter((f): f is ParsedFaq => f !== null),
        );
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Unable to load locations. Please try again later.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(payload: BookingPayload): Promise<BookingResult> {
    return createBooking(payload);
  }

  async function handlePrice(
    pickup: number,
    destination: number,
    vehicle: VehicleClass,
  ): Promise<number | null> {
    try {
      const quote = await getPriceQuote(pickup, destination, vehicle);
      return quote.price;
    } catch {
      return null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Book Your Next Airport Ride
        </h1>
        <p className="mt-3 text-slate-600">
          Flat-rate pricing. Reliable drivers. Confirmed in seconds.
        </p>
      </section>

      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow ring-1 ring-slate-200">
          Loading locations…
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-6 text-center text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <BookingForm
          locations={locations}
          onSubmit={handleSubmit}
          onFetchPrice={handlePrice}
        />
      )}

      {faq.length > 0 && (
        <section className="mx-auto mt-12 max-w-3xl px-4">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faq.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white p-5 shadow ring-1 ring-slate-200"
              >
                <h3 className="font-semibold text-slate-800">{item.question}</h3>
                <p className="mt-1 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
