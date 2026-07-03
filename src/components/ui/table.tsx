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
  emptyMessage = 'لا توجد بيانات.',
  id = 'data-table',
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10" id={id}>
      <table className="min-w-[42rem] w-full text-sm md:min-w-0">
        <thead>
          <tr className="border-b border-black/10 bg-black/5">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-slate-500"
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
                className="border-b border-black/5 hover:bg-black/5 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? '')}
                    </div>
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
