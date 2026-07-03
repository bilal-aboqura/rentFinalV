'use client';

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
  Unread: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Read: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  Unread: 'غير مقروءة',
  Read: 'مقروءة',
  Resolved: 'تمت المعالجة',
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ar-EG', {
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
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="text-sm text-slate-500">
        عرض <span className="font-medium text-slate-900">{inquiries.length}</span> من أصل{' '}
        <span className="font-medium text-slate-900">{totalCount}</span> رسالة
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
            <Inbox className="h-6 w-6" />
            <span className="text-sm">لا توجد رسائل حالياً.</span>
          </div>
        ) : (
          <>
          <div className="mobile-card-list p-3 md:hidden">
            {inquiries.map((inquiry) => (
              <button
                key={inquiry.id}
                type="button"
                onClick={() => setSelected(inquiry)}
                className="mobile-data-card text-right"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{inquiry.name}</p>
                    <p className="mt-1 overflow-hidden text-ellipsis text-xs text-slate-500" dir="ltr">
                      {inquiry.email}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      STATUS_BADGE[inquiry.status]
                    }`}
                  >
                    {STATUS_LABELS[inquiry.status]}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">الموضوع</span>
                    <span className="mobile-data-value">{inquiry.subject}</span>
                  </div>
                  <div className="mobile-data-row">
                    <span className="mobile-data-label">وقت الاستلام</span>
                    <span className="mobile-data-value">{formatDateTime(inquiry.created_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-black/10">
                <tr className="text-right text-slate-500">
                  <th className="px-5 py-3 font-medium">المرسل</th>
                  <th className="px-5 py-3 font-medium">الموضوع</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium">وقت الاستلام</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() => setSelected(inquiry)}
                    className="cursor-pointer border-b border-black/5 transition-colors hover:bg-black/5"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{inquiry.name}</p>
                      <p className="text-xs text-slate-500" dir="ltr">
                        {inquiry.email}
                      </p>
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-700">{inquiry.subject}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[inquiry.status]
                        }`}
                      >
                        {STATUS_LABELS[inquiry.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-700">
                      {formatDateTime(inquiry.created_at)}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            الصفحة {page} من {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              id="inquiries-prev-page"
              type="button"
              onClick={() => navigate({ page: Math.max(1, page - 1) })}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              id="inquiries-next-page"
              type="button"
              onClick={() => navigate({ page: Math.min(totalPages, page + 1) })}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-all hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
