import { useEffect, useState } from 'react';
import { BookingForm } from '../components/BookingForm';
import { Card } from '../components/ui';
import { Layout } from '../components/Layout';
import { fetchLocations } from '../services/locations';
import { getPriceQuote, createBooking } from '../services/bookings';
import { getApiErrorMessage } from '../services/api';
import type { LocationDTO } from '../types';

export default function Booking() {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load locations.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Book your airport transfer</h1>
          <p className="mt-2 text-slate-600">Flat-rate pricing, professional drivers, booked in under a minute.</p>
        </header>
        {loading && <p className="text-center text-slate-500">Loading locations…</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-center text-red-700">{error}</p>}
        {!loading && !error && (
          <Card>
            <BookingForm locations={locations} onQuote={getPriceQuote} onSubmit={createBooking} />
          </Card>
        )}
      </div>
    </Layout>
  );
}
