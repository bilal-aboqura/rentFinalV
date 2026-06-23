import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Button, Card, Field, Input } from '../components/ui';
import {
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getApiErrorMessage,
} from '../services/admin';
import type { DriverDTO } from '../types';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<DriverDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDrivers(await fetchDrivers());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load drivers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!name.trim() || !phone.trim() || !plate.trim()) {
      setFormError('All fields are required.');
      return;
    }
    setCreating(true);
    try {
      await createDriver({ name: name.trim(), phone: phone.trim(), license_plate: plate.trim() });
      setName('');
      setPhone('');
      setPlate('');
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not create driver.'));
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(driver: DriverDTO) {
    try {
      await updateDriver(driver.id, { status: driver.status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function remove(driver: DriverDTO) {
    if (!confirm(`Delete driver ${driver.name}?`)) return;
    try {
      await deleteDriver(driver.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Drivers</h1>

      <Card className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Add driver</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-4" noValidate>
          <Field label="Name" htmlFor="driver-name" required>
            <Input id="driver-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="driver-phone" required>
            <Input id="driver-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="License plate" htmlFor="driver-plate" required>
            <Input id="driver-plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" loading={creating} className="w-full">Add</Button>
          </div>
        </form>
        {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
      </Card>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <Card className="overflow-hidden p-0">
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">License plate</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
              {!loading && drivers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No drivers yet.</td></tr>
              )}
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.license_plate}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => toggleStatus(d)}>
                        {d.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(d)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y divide-slate-100 md:hidden">
          {drivers.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{d.name}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{d.status}</span>
              </div>
              <span className="text-xs text-slate-500">{d.phone} · {d.license_plate}</span>
              <div className="flex gap-1">
                <Button variant="outline" className="px-2 py-1 text-xs" onClick={() => toggleStatus(d)}>Toggle</Button>
                <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(d)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AdminLayout>
  );
}
