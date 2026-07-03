'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { X, MapPin, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
} from '@/app/admin/locations/actions';
import type { LocationRow, LocationType } from '@/lib/validation/location';

interface LocationFormModalProps {
  mode: 'create' | 'edit';
  initialData?: LocationRow;
  onClose: () => void;
  onSuccess: (location: LocationRow) => void;
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  city: 'مدينة',
  airport: 'مطار',
};

export function LocationFormModal({
  mode,
  initialData,
  onClose,
  onSuccess,
}: LocationFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<LocationType>(initialData?.type ?? 'city');
  const [isActive, setIsActive] = useState(initialData?.status !== 'inactive');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createLocationAction({ name, type, isActive })
          : await updateLocationAction({ id: initialData!.id, name, type, isActive });

      if (result.success && result.data) {
        onSuccess(result.data);
      } else if (!result.success) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors as Record<string, string[]>);
        }
        setError(result.error ?? 'حدث خطأ غير متوقع.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" id="location-form-modal">
      <div className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'create' ? 'إضافة موقع' : 'تعديل الموقع'}
            </h2>
          </div>
          <button
            id="location-form-close-btn"
            onClick={onClose}
            className="text-slate-500 transition-colors hover:text-slate-900"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="location-form" className="space-y-4">
          <div>
            <label htmlFor="location-name" className="mb-1 block text-sm text-slate-500">
              اسم الموقع
            </label>
            <input
              id="location-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مطار القاهرة"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              required
            />
            {validationErrors.name && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="location-type" className="mb-1 block text-sm text-slate-500">
              النوع
            </label>
            <select
              id="location-type"
              value={type}
              onChange={(e) => setType(e.target.value as LocationType)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="city">مدينة</option>
              <option value="airport">مطار</option>
            </select>
            {validationErrors.type && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.type[0]}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="location-active-toggle"
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative h-5 w-10 rounded-full transition-colors ${
                isActive ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-slate-600">
              {isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              id="location-form-cancel-btn"
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              إلغاء
            </button>
            <button
              id="location-form-submit-btn"
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'إضافة الموقع' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
        setError(result.error ?? 'تعذر حذف الموقع.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" id="delete-confirm-modal">
      <div className="relative max-h-[calc(100vh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-black/10 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">حذف الموقع</h2>
            <p className="text-sm text-slate-500">لا يمكن التراجع عن هذا الإجراء.</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          هل أنت متأكد من حذف <span className="font-semibold text-slate-900">{location.name}</span>؟
          إذا كان هذا الموقع مستخدمًا في الحجوزات أو قواعد التسعير فسيتم منع الحذف.
        </p>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            id="delete-confirm-cancel-btn"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            إلغاء
          </button>
          <button
            id="delete-confirm-submit-btn"
            onClick={handleDelete}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

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
  }, [initialPageSize, page, search]);

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

  const TYPE_BADGE: Record<LocationType, string> = {
    city: 'bg-blue-500/20 text-blue-700',
    airport: 'bg-purple-500/20 text-purple-700',
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المواقع</h1>
          <p className="mt-1 text-sm text-slate-500">إجمالي المواقع: {total}</p>
        </div>
        <button
          id="add-location-btn"
          onClick={() => {
            setSelectedLocation(null);
            setModalMode('create');
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 sm:w-auto"
        >
          <MapPin className="h-4 w-4" />
          إضافة موقع
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-col gap-2 sm:flex-row" id="location-search-form">
        <input
          id="location-search-input"
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="ابحث عن موقع..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <button
          id="location-search-btn"
          type="submit"
          className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200"
        >
          بحث
        </button>
        {search && (
          <button
            id="location-search-clear-btn"
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-500 transition-all hover:text-slate-900"
          >
            مسح
          </button>
        )}
      </form>

      <div className="rounded-xl border border-black/10" id="locations-table">
        <div className="mobile-card-list p-3 md:hidden">
          {isLoading ? (
            <div className="mobile-data-card py-8 text-center text-slate-500">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : locations.length === 0 ? (
            <div className="mobile-data-card py-8 text-center text-sm text-slate-500">
              {search ? `لا توجد نتائج مطابقة لـ "${search}".` : 'لا توجد مواقع بعد. أضف أول موقع للبدء.'}
            </div>
          ) : (
            locations.map((loc) => (
              <article key={loc.id} className="mobile-data-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 break-words text-sm font-semibold text-slate-900">{loc.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      loc.status === 'active'
                        ? 'bg-green-500/20 text-green-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {loc.status === 'active' ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">النوع</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[loc.type]}`}>
                      {LOCATION_TYPE_LABELS[loc.type]}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">تاريخ الإنشاء</span>
                    <span className="mobile-data-value">
                      {new Date(loc.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    id={`edit-location-mobile-${loc.id}`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setModalMode('edit');
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                  >
                    تعديل
                  </button>
                  <button
                    id={`delete-location-mobile-${loc.id}`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setModalMode('delete');
                    }}
                    className="flex-1 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-medium text-red-500 transition-all hover:bg-red-500/10"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-right">
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-500">الاسم</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-500">النوع</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-500">الحالة</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wider text-slate-500">تاريخ الإنشاء</th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-500">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {search ? `لا توجد نتائج مطابقة لـ "${search}".` : 'لا توجد مواقع بعد. أضف أول موقع للبدء.'}
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="border-b border-black/5 transition-colors hover:bg-black/5">
                  <td className="px-4 py-3 font-medium text-slate-900">{loc.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[loc.type]}`}>
                      {LOCATION_TYPE_LABELS[loc.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        loc.status === 'active'
                          ? 'bg-green-500/20 text-green-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {loc.status === 'active' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(loc.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        id={`edit-location-${loc.id}`}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setModalMode('edit');
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
                      >
                        تعديل
                      </button>
                      <button
                        id={`delete-location-${loc.id}`}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setModalMode('delete');
                        }}
                        className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-500/10"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            الصفحة <span className="font-medium text-slate-700">{page}</span> من{' '}
            <span className="font-medium text-slate-700">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              id="pagination-prev"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              السابق
            </button>
            <button
              id="pagination-next"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              التالي
            </button>
          </div>
        </div>
      )}

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
