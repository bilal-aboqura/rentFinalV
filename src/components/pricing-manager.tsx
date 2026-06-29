'use client';

/**
 * T009 [US1] / T013 [US2] / T017 [US3] / T020 [US4]
 * PricingManager — full CRUD client component for admin pricing page.
 *
 * Spec: specs/003-pricing-management/spec.md
 */

import React, { useState, useTransition, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Route,
  ChevronRight,
} from 'lucide-react';
import { deleteRoutePriceAction, getRoutePricesAction } from '@/app/admin/pricing/actions';
import { PricingFormModal, DeletePricingConfirmModal } from '@/components/pricing-form';
import type { RoutePriceRow } from '@/lib/validation/pricing';
import type { LocationRow } from '@/lib/validation/location';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface PricingManagerProps {
  initialPrices: RoutePriceRow[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialTotalPages: number;
  locations: LocationRow[];
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------
export function PricingManager({
  initialPrices,
  initialTotal,
  initialPage,
  initialPageSize,
  initialTotalPages,
  locations,
}: PricingManagerProps) {
  // State
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

  // ----------------------------------------------------------------
  // Toast helper
  // ----------------------------------------------------------------
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ----------------------------------------------------------------
  // Refresh data after mutations
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // CRUD handlers
  // ----------------------------------------------------------------
  const handleCreateSuccess = (created: RoutePriceRow) => {
    setFormMode(null);
    refreshPage(1);
    showToast('Pricing rule added successfully.', 'success');
  };

  const handleEditSuccess = (updated: RoutePriceRow) => {
    setFormMode(null);
    setEditingRow(undefined);
    refreshPage(page);
    showToast('Pricing rule updated successfully.', 'success');
  };

  const handleDeleteConfirm = (id: string) => {
    startTransition(async () => {
      const result = await deleteRoutePriceAction(id);
      setDeletingRow(null);
      if (result.success) {
        // If we deleted the last item on this page, go to previous page
        const newPage = prices.length === 1 && page > 1 ? page - 1 : page;
        refreshPage(newPage);
        showToast('Pricing rule deleted.', 'success');
      } else {
        showToast(result.error ?? 'Failed to delete.', 'error');
      }
    });
  };

  const openEdit = (row: RoutePriceRow) => {
    setEditingRow(row);
    setFormMode('edit');
  };

  // ----------------------------------------------------------------
  // Pagination
  // ----------------------------------------------------------------
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    refreshPage(newPage);
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Pricing Management</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Manage flat-rate prices for airport transfer routes.
          </p>
        </div>

        <button
          id="add-route-price-btn"
          onClick={() => {
            setEditingRow(undefined);
            setFormMode('create');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-sm font-medium shadow-lg shadow-indigo-900/30"
        >
          <Plus className="w-4 h-4" />
          Add Route Price
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>
          {total === 0
            ? 'No pricing rules defined yet.'
            : `${total} pricing rule${total !== 1 ? 's' : ''} total`}
        </span>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {prices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Route className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No pricing rules have been configured yet.</p>
            <p className="text-slate-600 text-xs mt-1">
              Click &ldquo;Add Route Price&rdquo; to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm" id="pricing-table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prices.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                  id={`pricing-row-${row.id}`}
                >
                  {/* Route */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-slate-300">
                        {row.pickup_location_name ?? row.pickup_location_id.slice(0, 8) + '…'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="text-slate-300">
                        {row.destination_location_name ??
                          row.destination_location_id.slice(0, 8) + '…'}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-green-400 font-semibold tabular-nums">
                      {formatPrice(row.price)}
                    </span>
                  </td>

                  {/* Created At */}
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(row.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`edit-pricing-btn-${row.id}`}
                        onClick={() => openEdit(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                        aria-label="Edit pricing rule"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        id={`delete-pricing-btn-${row.id}`}
                        onClick={() => setDeletingRow(row)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs font-medium"
                        aria-label="Delete pricing rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Page {page} of {totalPages} &middot; {total} rules
          </p>
          <div className="flex items-center gap-2">
            <button
              id="pricing-prev-page-btn"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || isPending}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              id="pricing-next-page-btn"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || isPending}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-medium"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {formMode && (
        <PricingFormModal
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

      {/* Toast Notification */}
      {toast && (
        <div
          id="pricing-toast"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all animate-fade-in ${
            toast.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
