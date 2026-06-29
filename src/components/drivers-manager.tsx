'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit2, Trash2, Search, Car, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import DriverForm from '@/components/driver-form';
import {
  createDriverAction,
  updateDriverAction,
  deleteDriverAction,
} from '@/app/admin/drivers/actions';
import type { DriverRecord } from '@/lib/validation/driver';

// ----------------------------------------------------------------
// Status badge styles
// ----------------------------------------------------------------
const STATUS_STYLES: Record<string, string> = {
  Available: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Busy: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Inactive: 'bg-slate-700 text-slate-400 border-slate-600',
};

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface DriversManagerProps {
  drivers: DriverRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function DriversManager({
  drivers,
  total,
  page,
  pageSize,
  totalPages,
  search: initialSearch,
}: DriversManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Notification state
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const showNotification = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  // ----------------------------------------------------------------
  // Navigation helpers
  // ----------------------------------------------------------------
  const updateUrl = useCallback(
    (updates: { search?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.search !== undefined) {
        if (updates.search) {
          params.set('search', updates.search);
        } else {
          params.delete('search');
        }
        params.delete('page'); // reset page on new search
      }
      if (updates.page !== undefined) {
        if (updates.page > 1) {
          params.set('page', String(updates.page));
        } else {
          params.delete('page');
        }
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchInput });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateUrl({ search: '' });
  };

  // ----------------------------------------------------------------
  // CRUD handlers
  // ----------------------------------------------------------------
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDriver(null);
    showNotification('success', editingDriver ? 'Driver updated successfully.' : 'Driver added successfully.');
    router.refresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingDriver(null);
  };

  const handleStartEdit = (driver: DriverRecord) => {
    setEditingDriver(driver);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(null);
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteDriverAction(id);
      setDeletingId(null);
      if (result.success) {
        showNotification('success', 'Driver deleted.');
        router.refresh();
      } else {
        showNotification('error', result.error ?? 'Failed to delete driver.');
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="drivers-search-input"
              type="search"
              placeholder="Search by name or phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            id="drivers-search-btn"
            type="submit"
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-sm transition-all"
          >
            Search
          </button>
        </form>

        {/* Add Driver button */}
        {!showForm && (
          <button
            id="add-driver-btn"
            onClick={() => { setEditingDriver(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>

      {/* Add/Edit Form panel */}
      {showForm && (
        <div className="glass rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {editingDriver ? `Edit Driver: ${editingDriver.name}` : 'Add New Driver'}
          </h3>
          <DriverForm
            driver={editingDriver ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            createAction={createDriverAction}
            updateAction={updateDriverAction}
          />
        </div>
      )}

      {/* Results summary */}
      {initialSearch && (
        <p className="text-slate-500 text-xs">
          {total} result{total !== 1 ? 's' : ''} for &ldquo;{initialSearch}&rdquo;
        </p>
      )}

      {/* Drivers table */}
      <div className="glass rounded-2xl overflow-hidden">
        {drivers.length === 0 ? (
          <div className="py-16 text-center">
            <Car className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-500 text-sm">
              {initialSearch ? 'No drivers match your search.' : 'No drivers yet. Add your first driver above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-left text-slate-400">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Since</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr
                    key={driver.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4 text-white font-medium">{driver.name}</td>
                    <td className="px-5 py-4 text-slate-300 font-mono text-xs">{driver.phone}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          STATUS_STYLES[driver.availability_status] ?? STATUS_STYLES.Inactive
                        }`}
                      >
                        {driver.availability_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(driver.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {/* Edit */}
                        <button
                          id={`edit-driver-${driver.id}`}
                          onClick={() => handleStartEdit(driver)}
                          title="Edit driver"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete with confirmation */}
                        {deleteConfirmId === driver.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-400">Sure?</span>
                            <button
                              id={`confirm-delete-driver-${driver.id}`}
                              onClick={() => handleDelete(driver.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition-all"
                            >
                              Delete
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`delete-driver-${driver.id}`}
                            onClick={() => handleDeleteConfirm(driver.id)}
                            disabled={isPending && deletingId === driver.id}
                            title="Delete driver"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} drivers
          </p>
          <div className="flex items-center gap-2">
            <button
              id="drivers-prev-page"
              onClick={() => updateUrl({ page: page - 1 })}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              id="drivers-next-page"
              onClick={() => updateUrl({ page: page + 1 })}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
