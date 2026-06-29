import { useEffect, useState } from 'react';
import { UserPlus, Trash2, RefreshCw } from 'lucide-react';
import {
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  type Driver,
} from '../services/adminSettings';

const empty = { name: '', phone: '', license_plate: '', status: 'active' as 'active' | 'inactive' };

export function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDrivers(await fetchDrivers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await createDriver(form);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create driver.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(driver: Driver) {
    try {
      const updated = await updateDriver(driver.id, {
        status: driver.status === 'active' ? 'inactive' : 'active',
      });
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? updated : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update driver.');
    }
  }

  async function handleDelete(driver: Driver) {
    if (!confirm(`Delete driver "${driver.name}"?`)) return;
    try {
      await deleteDriver(driver.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete driver.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow ring-1 ring-slate-200 sm:grid-cols-5"
      >
        <input
          placeholder="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
        />
        <input
          placeholder="Phone"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
        />
        <input
          placeholder="License Plate"
          required
          value={form.license_plate}
          onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" /> {saving ? 'Adding…' : 'Add'}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">License Plate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading drivers…
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No drivers yet.
                </td>
              </tr>
            ) : (
              drivers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{d.license_plate}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(d)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        d.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {d.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(d)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
