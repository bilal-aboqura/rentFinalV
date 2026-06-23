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
import { AlertCircle, Search } from 'lucide-react';

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

  // Adjust local input when the URL `query` changes externally (e.g. browser nav).
  // Using the render-phase prop-change pattern instead of setState-in-effect.
  if (currentQuery !== lastUrlQuery) {
    setLastUrlQuery(currentQuery);
    setSearchInput(currentQuery);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

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
      {/* Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-950/50 border border-red-900 text-red-200 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
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
          </TableHeader>
          <TableBody>
            {initialLocations.length === 0 ? (
              <EmptyRow
                colSpan={4}
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
    </div>
  );
}
