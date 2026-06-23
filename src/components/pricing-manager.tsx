'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { RoutePrice, Location } from '@/types';
import PricingForm from './pricing-form';
import { deleteRoutePriceAction, createRoutePriceAction, updateRoutePriceAction } from '@/app/admin/pricing/actions';
import { Trash2, Edit, Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface PricingManagerProps {
  initialRoutePrices: RoutePrice[];
  totalCount: number;
  activeLocations: Location[];
  currentPage: number;
  limit: number;
}

export default function PricingManager({
  initialRoutePrices,
  totalCount,
  activeLocations,
  currentPage,
  limit,
}: PricingManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutePrice | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rule: RoutePrice) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this route pricing rule?')) return;

    setErrorMessage('');
    setSuccessMessage('');

    const res = await deleteRoutePriceAction(id);
    if (res.success) {
      setSuccessMessage('Pricing rule deleted successfully.');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Failed to delete pricing rule.');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setErrorMessage('');
    setSuccessMessage('');

    let res;
    if (editingRule) {
      res = await updateRoutePriceAction({ id: editingRule.id, ...formData });
    } else {
      res = await createRoutePriceAction(formData);
    }

    if (res.success) {
      setSuccessMessage(
        editingRule
          ? 'Pricing rule updated successfully.'
          : 'Pricing rule created successfully.'
      );
      router.refresh();
      return { success: true };
    } else {
      return {
        success: false,
        error: res.error,
        validationErrors: res.validationErrors,
      };
    }
  };

  // Helper to determine if a location mapped in a pricing rule is inactive
  // (i.e. is not in the list of activeLocations because it was deactivated)
  const isLocationDeactivated = (locId: string, locName: string | undefined) => {
    if (!locName || locName === 'Unknown Location') return true;
    return !activeLocations.some(l => l.id === locId);
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
          <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-xl font-semibold text-white">Route Pricing Matrix</h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure flat-rate pricing rules for trips between active locations.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-950/30 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Route Price</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">From (Pickup)</th>
                <th className="px-6 py-4">To (Destination)</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {initialRoutePrices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                    No route prices configured yet. Click "Add Route Price" to get started.
                  </td>
                </tr>
              ) : (
                initialRoutePrices.map(rule => {
                  const pickupDeactivated = isLocationDeactivated(
                    rule.pickupLocationId,
                    rule.pickupLocationName
                  );
                  const destDeactivated = isLocationDeactivated(
                    rule.destinationLocationId,
                    rule.destinationLocationName
                  );
                  const isRouteDisabled = pickupDeactivated || destDeactivated;

                  return (
                    <tr
                      key={rule.id}
                      className={`hover:bg-slate-800/25 transition-colors ${
                        isRouteDisabled ? 'text-slate-500 bg-slate-950/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{rule.pickupLocationName}</span>
                          {pickupDeactivated && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-950/40 border border-amber-900 text-amber-400 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{rule.destinationLocationName}</span>
                          {destDeactivated && (
                            <span className="flex items-center gap-1 text-[11px] font-semibold bg-amber-950/40 border border-amber-900 text-amber-400 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        ${rule.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            title="Edit Price"
                            className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            title="Delete Route"
                            className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 hover:border-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">
              Showing Page {currentPage} of {totalPages} ({totalCount} total routes)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <PricingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingRule}
        activeLocations={activeLocations}
      />
    </div>
  );
}
