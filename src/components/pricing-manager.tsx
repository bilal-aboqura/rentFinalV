'use client';

import React, { useState, useTransition, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Route,
  ChevronLeft,
} from 'lucide-react';
import { deleteRoutePriceAction, getRoutePricesAction } from '@/app/admin/pricing/actions';
import { PricingFormModal, DeletePricingConfirmModal } from '@/components/pricing-form';
import type { RoutePriceRow } from '@/lib/validation/pricing';
import type { LocationRow } from '@/lib/validation/location';

interface PricingManagerProps {
  initialPrices: RoutePriceRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
  locations: LocationRow[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(price);
}

function formatVehicleClass(vehicleClass: RoutePriceRow['vehicle_class']): string {
  if (vehicleClass === 'standard') return 'عادية';
  if (vehicleClass === 'executive') return 'تنفيذية';
  return 'فان';
}

export function PricingManager({
  initialPrices,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages,
  locations,
}: PricingManagerProps) {
  const [prices, setPrices] = useState<RoutePriceRow[]>(initialPrices);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [pageSize] = useState(initialPageSize);

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingRow, setEditingRow] = useState<RoutePriceRow | undefined>(undefined);
  const [deletingRow, setDeletingRow] = useState<RoutePriceRow | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const refreshPage = useCallback(
    (targetPage: number) => {
      startTransition(async () => {
        const result = await getRoutePricesAction({ page: targetPage, pageSize });
        if (result.success && result.data) {
          setPrices(result.data.prices);
          setTotal(result.data.total);
          setPage(result.data.page);
          setTotalPages(result.data.totalPages);
        }
      });
    },
    [pageSize]
  );

  const handleCreateSuccess = () => {
    setFormMode(null);
    refreshPage(1);
    showToast('تمت إضافة قاعدة التسعير بنجاح.', 'success');
  };

  const handleEditSuccess = () => {
    setFormMode(null);
    setEditingRow(undefined);
    refreshPage(page);
    showToast('تم تحديث قاعدة التسعير بنجاح.', 'success');
  };

  const handleDeleteConfirm = (id: string) => {
    startTransition(async () => {
      const result = await deleteRoutePriceAction(id);
      setDeletingRow(null);
      if (result.success) {
        const newPage = prices.length === 1 && page > 1 ? page - 1 : page;
        refreshPage(newPage);
        showToast('تم حذف قاعدة التسعير.', 'success');
      } else {
        showToast(result.error ?? 'تعذر الحذف.', 'error');
      }
    });
  };

  const openEdit = (row: RoutePriceRow) => {
    setEditingRow(row);
    setFormMode('edit');
  };

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    refreshPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-slate-900">إدارة الأسعار</h1>
          </div>
          <p className="text-sm text-slate-500">إدارة الأسعار الثابتة لمسارات النقل المختلفة.</p>
        </div>

        <button
          id="add-route-price-btn"
          onClick={() => {
            setEditingRow(undefined);
            setFormMode('create');
          }}
          className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          إضافة سعر مسار
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>
          {total === 0 ? 'لا توجد قواعد تسعير بعد.' : `إجمالي قواعد التسعير: ${total}`}
        </span>
      </div>

      <div className="glass rounded-2xl border border-black/10">
        {prices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Route className="mb-3 h-12 w-12 text-slate-400" />
            <p className="text-sm text-slate-500">لم يتم إعداد أي أسعار للمسارات بعد.</p>
            <p className="mt-1 text-xs text-slate-600">اضغط على &quot;إضافة سعر مسار&quot; للبدء.</p>
          </div>
        ) : (
          <>
          <div className="mobile-card-list p-3 md:hidden">
            {prices.map((row) => (
              <article key={row.id} className="mobile-data-card" id={`pricing-card-${row.id}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">
                      {row.pickup_location_name ?? `${row.pickup_location_id.slice(0, 8)}...`}
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-500">
                      {row.destination_location_name ?? `${row.destination_location_id.slice(0, 8)}...`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {formatVehicleClass(row.vehicle_class)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">السعر</span>
                    <span className="mobile-data-value font-semibold text-green-600" dir="ltr">
                      {formatPrice(row.price)}
                    </span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">تاريخ الإنشاء</span>
                    <span className="mobile-data-value">
                      {new Date(row.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    id={`edit-pricing-mobile-btn-${row.id}`}
                    onClick={() => openEdit(row)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    aria-label="تعديل قاعدة التسعير"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    تعديل
                  </button>
                  <button
                    id={`delete-pricing-mobile-btn-${row.id}`}
                    onClick={() => setDeletingRow(row)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
                    aria-label="حذف قاعدة التسعير"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm" id="pricing-table">
            <thead>
              <tr className="border-b border-black/10 text-right">
                <th className="px-5 py-3.5 text-xs font-medium tracking-wider text-slate-500">
                  المسار
                </th>
                <th className="px-5 py-3.5 text-xs font-medium tracking-wider text-slate-500">
                  السعر
                </th>
                <th className="px-5 py-3.5 text-xs font-medium tracking-wider text-slate-500">
                  الفئة
                </th>
                <th className="px-5 py-3.5 text-xs font-medium tracking-wider text-slate-500">
                  تاريخ الإنشاء
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium tracking-wider text-slate-500">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prices.map((row) => (
                <tr
                  key={row.id}
                  className="group transition-colors hover:bg-black/[0.02]"
                  id={`pricing-row-${row.id}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <span className="text-slate-700">
                        {row.pickup_location_name ?? `${row.pickup_location_id.slice(0, 8)}...`}
                      </span>
                      <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                      <span className="text-slate-700">
                        {row.destination_location_name ?? `${row.destination_location_id.slice(0, 8)}...`}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold tabular-nums text-green-600" dir="ltr">
                      {formatPrice(row.price)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-700">
                    {formatVehicleClass(row.vehicle_class)}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(row.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                      <button
                        id={`edit-pricing-btn-${row.id}`}
                        onClick={() => openEdit(row)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-black/5 hover:text-slate-900"
                        aria-label="تعديل قاعدة التسعير"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        تعديل
                      </button>
                      <button
                        id={`delete-pricing-btn-${row.id}`}
                        onClick={() => setDeletingRow(row)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:bg-red-400/5 hover:text-red-500"
                        aria-label="حذف قاعدة التسعير"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">
            الصفحة {page} من {totalPages} · إجمالي القواعد {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              id="pricing-prev-page-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:bg-black/5 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              السابق
            </button>
            <button
              id="pricing-next-page-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-all hover:bg-black/5 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              التالي
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {formMode && (
        <PricingFormModal
          key={`${formMode}-${editingRow?.id ?? 'new'}`}
          mode={formMode}
          initialData={editingRow}
          locations={locations as LocationRow[]}
          onClose={() => {
            setFormMode(null);
            setEditingRow(undefined);
          }}
          onSuccess={formMode === 'create' ? handleCreateSuccess : handleEditSuccess}
        />
      )}

      {deletingRow && (
        <DeletePricingConfirmModal
          routePrice={deletingRow}
          onClose={() => setDeletingRow(null)}
          onConfirm={handleDeleteConfirm}
          isPending={isPending}
        />
      )}

      {toast && (
        <div
          id="pricing-toast"
          className={`fixed inset-x-3 bottom-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-2xl sm:inset-x-auto sm:left-6 sm:bottom-6 ${
            toast.type === 'success'
              ? 'border border-green-500/30 bg-green-500/20 text-green-700'
              : 'border border-red-500/30 bg-red-500/20 text-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
