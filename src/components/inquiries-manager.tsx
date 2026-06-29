'use client';

/**
 * Spec 010 (F-10) — InquiriesManager (US2 + US3)
 *
 * Interactive dashboard manager. Pagination is URL-driven (the server page
 * re-runs `fetchInquiriesAction` on each navigation). Row clicks open the
 * InquiryDetailsModal for full message viewing and status management.
 *
 * Spec: specs/010-contact-inquiries/spec.md (FR-007 .. FR-010)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { updateInquiryStatusAction } from '@/app/admin/inquiries/actions';
import { type ContactInquiry, type InquiryStatus } from '@/lib/validation/contact';
import InquiryDetailsModal from './inquiry-details-modal';

interface Props {
  inquiries: ContactInquiry[];
  totalCount: number;
  page: number;
  totalPages: number;
}

const STATUS_BADGE: Record<InquiryStatus, string> = {
  Unread: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Read: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function InquiriesManager({
  inquiries,
  totalCount,
  page,
  totalPages,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<ContactInquiry | null>(null);
  const [error, setError] = useState('');

  /** Push a new page into the URL search params. */
  const navigate = (next: { page?: number }) => {
    const sp = new URLSearchParams();
    const nextPage = next.page ?? page;
    if (nextPage > 1) sp.set('page', String(nextPage));
    router.push(`/admin/inquiries?${sp.toString()}`);
  };

  const handleStatusChange = async (
    inquiryId: string,
    status: InquiryStatus
  ): Promise<boolean> => {
    setError('');
    const result = await updateInquiryStatusAction({ inquiryId, status });
    if (result.success) {
      setSelected(result.data);
      router.refresh();
      return true;
    }
    setError(result.error);
    return false;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Count summary */}
      <div className="text-sm text-slate-500">
        Showing <span className="text-white font-medium">{inquiries.length}</span> of{' '}
        <span className="text-white font-medium">{totalCount}</span> inquiries
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Inbox className="w-6 h-6" />
            <span className="text-sm">No inquiries found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-left text-slate-400">
                  <th className="px-5 py-3 font-medium">Sender</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() => setSelected(inquiry)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{inquiry.name}</p>
                      <p className="text-slate-500 text-xs">{inquiry.email}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-300 max-w-xs truncate">
                      {inquiry.subject}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          STATUS_BADGE[inquiry.status]
                        }`}
                      >
                        {inquiry.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300 text-xs whitespace-nowrap">
                      {formatDateTime(inquiry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              id="inquiries-prev-page"
              type="button"
              onClick={() => navigate({ page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="inquiries-next-page"
              type="button"
              onClick={() => navigate({ page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Details modal — remounted per inquiry via key */}
      {selected && (
        <InquiryDetailsModal
          key={selected.id}
          inquiry={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
