'use client';

import React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------- Presentational Table primitives ----------
// These can be composed inside server- or client-rendered admin views.

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-xs uppercase tracking-wider">
        {children}
      </tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
      {children}
    </tbody>
  );
}

export function TableHead({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return <th className={`px-6 py-4 ${alignClass} ${className}`}>{children}</th>;
}

export function TableCell({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td className={`px-6 py-4 ${alignClass} ${className}`}>
      {children}
    </td>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-slate-800/25 transition-colors">{children}</tr>;
}

export function EmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="text-center py-12 text-slate-500 font-medium"
      >
        {message}
      </td>
    </tr>
  );
}

// ---------- Pagination (client, URL-driven) ----------

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  itemName = 'items',
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
      <span className="text-xs text-slate-400 font-medium">
        Showing Page {currentPage} of {totalPages} ({totalCount} total {itemName})
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
  );
}
