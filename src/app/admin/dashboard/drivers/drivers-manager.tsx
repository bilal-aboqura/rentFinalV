'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Driver } from '@/types';
import {
  createDriverAction,
  updateDriverAction,
  deleteDriverAction,
} from '@/app/admin/dashboard/actions';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, CheckCircle, Car } from 'lucide-react';

interface Props {
  drivers: Driver[];
}

export default function DriversManager({ drivers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', licensePlate: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm({ name: '', phone: '', licensePlate: '' });
    setValidationErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');
    setValidationErrors({});
    startTransition(async () => {
      const input = editingId ? { id: editingId, ...form } : form;
      const result = editingId
        ? await updateDriverAction(input)
        : await createDriverAction(input);

      if (result.success) {
        setSuccess(editingId ? 'Driver updated.' : 'Driver created.');
        resetForm();
        router.refresh();
      } else {
        if (result.validationErrors) {
          const errs: Record<string, string> = {};
          Object.entries(result.validationErrors).forEach(([k, msgs]) => { errs[k] = msgs[0]; });
          setValidationErrors(errs);
        } else {
          setError(result.error);
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this driver? This cannot be undone.')) return;
    setError('');
    startTransition(async () => {
      const result = await deleteDriverAction(id);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  };

  const startEdit = (driver: Driver) => {
    setForm({ name: driver.name, phone: driver.phone, licensePlate: driver.license_plate });
    setEditingId(driver.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          id="add-driver-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {editingId ? 'Edit Driver' : 'New Driver'}
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-name">Full Name</label>
              <input
                id="driver-name"
                type="text"
                placeholder="Ahmed Al-Rashid"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
              {validationErrors.name && <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-phone">Phone</label>
              <input
                id="driver-phone"
                type="tel"
                placeholder="+1234567890"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
              {validationErrors.phone && <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1" htmlFor="driver-plate">License Plate</label>
              <input
                id="driver-plate"
                type="text"
                placeholder="ABC123"
                value={form.licensePlate}
                onChange={(e) => setForm((p) => ({ ...p, licensePlate: e.target.value }))}
                className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
              {validationErrors.licensePlate && <p className="text-red-400 text-xs mt-1">{validationErrors.licensePlate}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              id="driver-form-save-btn"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? 'Save Changes' : 'Create Driver'}
            </button>
            <button
              onClick={resetForm}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Drivers table */}
      <div className="glass rounded-2xl overflow-hidden">
        {drivers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Car className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No drivers yet. Add your first driver above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr className="text-left text-slate-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">License Plate</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{driver.name}</td>
                  <td className="px-5 py-4 text-slate-300">{driver.phone}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{driver.license_plate}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      driver.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        id={`edit-driver-${driver.id}`}
                        onClick={() => startEdit(driver)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`delete-driver-${driver.id}`}
                        onClick={() => handleDelete(driver.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
