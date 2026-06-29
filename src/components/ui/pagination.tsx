/**
 * T013 [US1] - Pagination UI component.
 */
'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  id?: string;
}

export function Pagination({ page, totalPages, onPageChange, id = 'pagination' }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4" id={id}>
      <p className="text-sm text-slate-500">
        Page <span className="text-slate-300 font-medium">{page}</span> of{' '}
        <span className="text-slate-300 font-medium">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          id="pagination-prev"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            id={`pagination-page-${p}`}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          id="pagination-next"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
