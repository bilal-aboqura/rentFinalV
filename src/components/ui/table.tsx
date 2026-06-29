/**
 * T013 [US1] - Reusable Table UI component for admin data tables.
 */
'use client';

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  id?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No data found.',
  id = 'data-table',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10" id={id}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row.id ?? i)}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-300">
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
