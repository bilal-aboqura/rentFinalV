import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Button, Card, Input, Select } from '../components/ui';
import {
  fetchAdminBookings,
  updateBookingStatus,
  assignDriver,
  fetchDrivers,
  getApiErrorMessage,
} from '../services/admin';
import type { BookingListItemDTO, DriverDTO } from '../types';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];
const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function AdminBookings() {
  const [rows, setRows] = useState<BookingListItemDTO[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminBookings({ page, limit, status: status || undefined, search: search || undefined });
      setRows(data.rows);
      setCount(data.count);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load bookings.'));
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetchDrivers().then(setDrivers).catch(() => undefined);
  }, []);

  const totalPages = Math.max(Math.ceil(count / limit), 1);

  async function handleStatus(id: number, next: string) {
    setActionError((prev) => ({ ...prev, [id]: '' }));
    try {
      await updateBookingStatus(id, next);
      await load();
    } catch (err) {
      setActionError((prev) => ({ ...prev, [id]: getApiErrorMessage(err) }));
    }
  }

  async function handleAssign(id: number, driverId: string) {
    if (!driverId) return;
    setActionError((prev) => ({ ...prev, [id]: '' }));
    try {
      await assignDriver(id, Number(driverId));
      await load();
    } catch (err) {
      setActionError((prev) => ({ ...prev, [id]: getApiErrorMessage(err) }));
    }
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search name, email, or reference"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="sm:w-64"
          />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-40">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Button type="submit" variant="outline">Search</Button>
        </form>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <Card className="overflow-hidden p-0">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Trip</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No bookings found.</td></tr>
              )}
              {rows.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{b.reference_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{b.customer_name}</div>
                    <div className="text-xs text-slate-500">{b.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(b.trip_date_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-900">${Number(b.total_price).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={b.Driver?.id ?? ''} onChange={(e) => handleAssign(b.id, e.target.value)} className="min-w-[8rem] py-1.5 text-xs">
                      <option value="">{b.Driver ? b.Driver.name : 'Assign…'}</option>
                      {drivers.filter((d) => d.id !== b.Driver?.id).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {b.status === 'pending' && (
                        <>
                          <Button variant="primary" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'confirmed')}>Confirm</Button>
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'cancelled')}>Cancel</Button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'completed')}>Complete</Button>
                          <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'cancelled')}>Cancel</Button>
                        </>
                      )}
                    </div>
                    {actionError[b.id] && <p className="mt-1 text-xs text-red-600">{actionError[b.id]}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-slate-100 md:hidden">
          {rows.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-700">{b.reference_id}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[b.status]}`}>{b.status}</span>
              </div>
              <div className="font-medium text-slate-900">{b.customer_name}</div>
              <div className="text-xs text-slate-500">{new Date(b.trip_date_time).toLocaleString()} · ${Number(b.total_price).toFixed(2)}</div>
              <div className="flex flex-wrap gap-1">
                {b.status === 'pending' && (
                  <>
                    <Button variant="primary" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'confirmed')}>Confirm</Button>
                    <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'cancelled')}>Cancel</Button>
                  </>
                )}
                {b.status === 'confirmed' && (
                  <>
                    <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'completed')}>Complete</Button>
                    <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => handleStatus(b.id, 'cancelled')}>Cancel</Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>{count} total</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="flex items-center px-2">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
