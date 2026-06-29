'use client';

/**
 * T023 [US2] / T028 [US3] / T032 [US4]
 * Location Form modal for creating and editing locations, and delete confirmation.
 */
import React, { useState, useTransition, useEffect } from 'react';
import { X, MapPin, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
} from '@/app/admin/locations/actions';
import type { LocationRow } from '@/lib/validation/location';

type LocationType = 'City' | 'Airport' | 'Pickup Point';

// ----------------------------------------------------------------
// Add / Edit Modal
// ----------------------------------------------------------------
interface LocationFormModalProps {
  mode: 'create' | 'edit';
  initialData?: LocationRow;
  onClose: () => void;
  onSuccess: (location: LocationRow) => void;
}

export function LocationFormModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: LocationFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<LocationType>((initialData?.type as LocationType) ?? 'City');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    startTransition(async () => {
      let result;
      if (mode === 'create') {
        result = await createLocationAction({ name, type, isActive });
      } else {
        result = await updateLocationAction({ id: initialData!.id, name, type, isActive });
      }

      if (result.success && result.data) {
        onSuccess(result.data);
      } else if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors as Record<string, string[]>);
        }
        setError(result.error ?? 'An error occurred.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" id="location-form-modal">
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">
              {mode === 'create' ? 'Add Location' : 'Edit Location'}
            </h2>
          </div>
          <button
            id="location-form-close-btn"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} id="location-form" className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="location-name" className="block text-sm text-slate-400 mb-1">
              Name
            </label>
            <input
              id="location-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. London Heathrow"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              required
            />
            {validationErrors.name && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.name[0]}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="location-type" className="block text-sm text-slate-400 mb-1">
              Type
            </label>
            <select
              id="location-type"
              value={type}
              onChange={(e) => setType(e.target.value as LocationType)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
            >
              <option value="City">City</option>
              <option value="Airport">Airport</option>
              <option value="Pickup Point">Pickup Point</option>
            </select>
            {validationErrors.type && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.type[0]}</p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3">
            <button
              id="location-active-toggle"
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                isActive ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-slate-400">
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              id="location-form-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              id="location-form-submit-btn"
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'create' ? 'Add Location' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// T032 [US4] - Delete Confirmation Modal
// ----------------------------------------------------------------
interface DeleteConfirmModalProps {
  location: LocationRow;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export function DeleteConfirmModal({ location, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteLocationAction(location.id);
      if (result.success && result.data) {
        onSuccess(result.data.id);
      } else if (!result.success) {
        setError(result.error ?? 'Failed to delete location.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" id="delete-confirm-modal">
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Delete Location</h2>
            <p className="text-sm text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Are you sure you want to delete{' '}
          <span className="text-white font-semibold">{location.name}</span>? If this location
          is referenced by bookings or pricing rules, deletion will be blocked.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            id="delete-confirm-cancel-btn"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            id="delete-confirm-submit-btn"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// T032 [US1+US2+US3+US4] - Locations Manager (Client Component orchestrator)
// ----------------------------------------------------------------
interface LocationsManagerProps {
  initialLocations: LocationRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
  initialSearch: string;
}

export function LocationsManager({
  initialLocations,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages,
  initialSearch,
}: LocationsManagerProps) {
  const [locations, setLocations] = useState<LocationRow[]>(initialLocations);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationRow | null>(null);
  const [isLoading, startLoading] = useTransition();

  // Refetch when page or search changes
  useEffect(() => {
    startLoading(async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(initialPageSize),
        search,
      });
      const res = await fetch(`/admin/locations/api?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLocations(json.locations);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCreateSuccess = (location: LocationRow) => {
    setLocations((prev) => [location, ...prev]);
    setTotal((prev) => prev + 1);
    setModalMode(null);
  };

  const handleEditSuccess = (location: LocationRow) => {
    setLocations((prev) => prev.map((l) => (l.id === location.id ? location : l)));
    setModalMode(null);
  };

  const handleDeleteSuccess = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setTotal((prev) => prev - 1);
    setModalMode(null);
  };

  const TYPE_BADGE: Record<string, string> = {
    City: 'bg-blue-500/20 text-blue-300',
    Airport: 'bg-purple-500/20 text-purple-300',
    'Pickup Point': 'bg-teal-500/20 text-teal-300',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Locations</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total location{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          id="add-location-btn"
          onClick={() => { setSelectedLocation(null); setModalMode('create'); }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-all flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2" id="location-search-form">
        <input
          id="location-search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search locations..."
          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
        />
        <button
          id="location-search-btn"
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all text-sm font-medium"
        >
          Search
        </button>
        {search && (
          <button
            id="location-search-clear-btn"
            type="button"
            onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10" id="locations-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Created</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {search ? `No locations found for "${search}".` : 'No locations yet. Add one to get started.'}
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{loc.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[loc.type] ?? 'bg-slate-700/50 text-slate-300'}`}>
                      {loc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${loc.is_active ? 'bg-green-500/20 text-green-300' : 'bg-slate-700/50 text-slate-400'}`}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(loc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`edit-location-${loc.id}`}
                        onClick={() => { setSelectedLocation(loc); setModalMode('edit'); }}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        id={`delete-location-${loc.id}`}
                        onClick={() => { setSelectedLocation(loc); setModalMode('delete'); }}
                        className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page <span className="text-slate-300 font-medium">{page}</span> of{' '}
            <span className="text-slate-300 font-medium">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              id="pagination-prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium"
            >
              ← Prev
            </button>
            <button
              id="pagination-next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modalMode === 'create' && (
        <LocationFormModal
          mode="create"
          onClose={() => setModalMode(null)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {modalMode === 'edit' && selectedLocation && (
        <LocationFormModal
          mode="edit"
          initialData={selectedLocation}
          onClose={() => setModalMode(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      {modalMode === 'delete' && selectedLocation && (
        <DeleteConfirmModal
          location={selectedLocation}
          onClose={() => setModalMode(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
