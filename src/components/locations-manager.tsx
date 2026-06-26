'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Location } from '@/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  EmptyRow,
  Pagination,
} from '@/components/ui/table';
import LocationForm from '@/components/location-form';
import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
} from '@/app/admin/locations/actions';
import { AlertCircle, Search, Plus, CheckCircle2, Pencil, Trash2 } from 'lucide-react';

interface LocationsManagerProps {
  initialLocations: Location[];
  totalCount: number;
  currentPage: number;
  limit: number;
  currentQuery: string;
  fetchError?: string;
}

export default function LocationsManager({
  initialLocations,
  totalCount,
  currentPage,
  limit,
  currentQuery,
  fetchError,
}: LocationsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentQuery);
  const [lastUrlQuery, setLastUrlQuery] = useState(currentQuery);
  const [errorMessage, setErrorMessage] = useState(fetchError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Adjust local input when the URL `query` changes externally (e.g. browser nav).
  // Using the render-phase prop-change pattern instead of setState-in-effect.
  if (currentQuery !== lastUrlQuery) {
    setLastUrlQuery(currentQuery);
    setSearchInput(currentQuery);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setErrorMessage('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
  };

  const handleFormSubmit = async (formData: unknown) => {
    setErrorMessage('');
    setSuccessMessage('');

    const res = editingLocation
      ? await updateLocationAction(formData)
      : await createLocationAction(formData);

    if (res.success) {
      setSuccessMessage(
        editingLocation ? 'Location updated successfully.' : 'Location created successfully.'
      );
      router.refresh();
      return { success: true };
    }

    return {
      success: false,
      error: res.error,
      validationErrors: res.validationErrors as Record<string, string[]> | undefined,
    };
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;

    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const res = await deleteLocationAction(deletingLocation.id);
    setIsDeleting(false);

    if (res.success) {
      setSuccessMessage('Location deleted successfully.');
      setDeletingLocation(null);
      router.refresh();
      return;
    }

    setErrorMessage(res.error || 'Failed to delete location.');
    setDeletingLocation(null);
  };

  // Debounced search -> update URL ?query= (resets to page 1, triggers RSC refetch).
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const activeQuery = params.get('query') || '';
      if (searchInput === activeQuery) return;
      if (searchInput) {
        params.set('query', searchInput);
      } else {
        params.delete('query');
      }
      params.delete('page'); // reset to first page on new search
      router.push(`${pathname}?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput('');
    setErrorMessage('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('query');
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };


  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {errorMessage && (
        <div className="p-4 bg-red-950/50 border border-red-900 text-red-200 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-900 text-emerald-200 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">All Locations</h2>
            <p className="text-slate-400 text-sm mt-1">
              Search and manage cities, airports, and pickup points.
            </p>
          </div>
          <div className="sm:ml-auto relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name (e.g. Dallas)..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-sm"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/30 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {initialLocations.length === 0 ? (
              <EmptyRow
                colSpan={5}
                message={
                  currentQuery
                    ? `No locations match "${currentQuery}".`
                    : 'No locations found. Add one to get started.'
                }
              />
            ) : (
              initialLocations.map(loc => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium text-white">{loc.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full">
                      {loc.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {loc.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/40 border border-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {loc.createdAt ? new Date(loc.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(loc)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-300 cursor-pointer"
                        aria-label={`Edit ${loc.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setSuccessMessage('');
                          setDeletingLocation(loc);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-red-500 hover:text-red-300 cursor-pointer"
                        aria-label={`Delete ${loc.name}`}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemName="locations"
        />
      </div>

      {/* Add/Edit Location Modal (mounted only when open for a clean reset) */}
      {isFormOpen && (
        <LocationForm
          isOpen={true}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          initialData={editingLocation}
        />
      )}

      {deletingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 bg-slate-950/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Delete Location</h3>
            </div>
            <div className="space-y-5 p-6">
              <p className="text-sm leading-6 text-slate-300">
                Delete <span className="font-semibold text-white">{deletingLocation.name}</span>?
                Locations referenced by bookings or pricing rules will be blocked automatically.
              </p>
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setDeletingLocation(null)}
                  disabled={isDeleting}
                  className="rounded-xl bg-slate-850 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
