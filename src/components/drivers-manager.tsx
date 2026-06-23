'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Driver } from '@/types';
import DriverForm from './driver-form';
import { deleteDriverAction, createDriverAction, updateDriverAction } from '@/app/admin/drivers/actions';
import { Trash2, Edit, Plus, AlertCircle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

interface DriversManagerProps {
  initialDrivers: Driver[];
  totalCount: number;
  currentPage: number;
  limit: number;
  initialSearch: string;
}

export default function DriversManager({
  initialDrivers,
  totalCount,
  currentPage,
  limit,
  initialSearch,
}: DriversManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [searchVal, setSearchVal] = useState(initialSearch);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setSearchVal(initialSearch);
  }, [initialSearch]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal.trim() !== '') {
      params.set('search', searchVal.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // reset page on new search
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearSearch = () => {
    setSearchVal('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    setErrorMessage('');
    setSuccessMessage('');

    const res = await deleteDriverAction(id);
    if (res.success) {
      setSuccessMessage('Driver deleted successfully.');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Failed to delete driver.');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setErrorMessage('');
    setSuccessMessage('');

    let res;
    if (editingDriver) {
      res = await updateDriverAction({ id: editingDriver.id, ...formData });
    } else {
      res = await createDriverAction(formData);
    }

    if (res.success) {
      setSuccessMessage(
        editingDriver
          ? 'Driver updated successfully.'
          : 'Driver created successfully.'
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

  const getStatusBadgeClass = (status: Driver['availability_status']) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Busy':
        return 'bg-amber-950/40 border border-amber-900 text-amber-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Inactive':
        return 'bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      default:
        return 'bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
    }
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

      {/* Search and Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md flex items-center">
          <div className="absolute left-4 text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search drivers by name or phone..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-11 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
          />
          {searchVal && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-950/30 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Driver</span>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Driver Name</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {initialDrivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500 font-medium">
                    No drivers found. Click "Add New Driver" or clear filters to start.
                  </td>
                </tr>
              ) : (
                initialDrivers.map(driver => (
                  <tr key={driver.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{driver.name}</td>
                    <td className="px-6 py-4">{driver.phone}</td>
                    <td className="px-6 py-4">
                      <div className={getStatusBadgeClass(driver.availability_status)}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          driver.availability_status === 'Available' ? 'bg-emerald-400' :
                          driver.availability_status === 'Busy' ? 'bg-amber-400' : 'bg-slate-500'
                        }`} />
                        <span>{driver.availability_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(driver)}
                          title="Edit Driver"
                          className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          title="Delete Driver"
                          className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 hover:border-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">
              Showing Page {currentPage} of {totalPages} ({totalCount} total drivers)
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
      <DriverForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingDriver}
      />
    </div>
  );
}
