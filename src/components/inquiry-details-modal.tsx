'use client';

import { useState, useTransition } from 'react';
import { X, Mail, User, MessageSquare, Tag, Loader2, AlertCircle } from 'lucide-react';
import { type ContactInquiry, type InquiryStatus, INQUIRY_STATUSES } from '@/lib/validation/contact';

interface Props {
  inquiry: ContactInquiry;
  onClose: () => void;
  onStatusChange: (inquiryId: string, status: InquiryStatus) => Promise<boolean>;
}

const STATUS_COLORS: Record<InquiryStatus, string> = {
  Unread: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Read: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const STATUS_LABELS: Record<InquiryStatus, string> = {
  Unread: 'غير مقروءة',
  Read: 'مقروءة',
  Resolved: 'تمت المعالجة',
};

type FieldIcon = React.ComponentType<{ className?: string }>;

function DetailField({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: FieldIcon;
  label: string;
  value: React.ReactNode;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm text-slate-800" dir={dir}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function InquiryDetailsModal({
  inquiry,
  onClose,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSaveStatus = () => {
    setError('');
    setSuccess('');
    startTransition(async () => {
      const ok = await onStatusChange(inquiry.id, status);
      if (!ok) {
        setError('تعذر تحديث حالة الرسالة. قد تكون غير متاحة الآن.');
      } else {
        setSuccess('تم تحديث الحالة بنجاح.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-black/10 sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">تفاصيل الرسالة</h2>
            <p className="mt-0.5 text-xs text-slate-500">{inquiry.subject}</p>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-start">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                STATUS_COLORS[inquiry.status]
              }`}
            >
              {STATUS_LABELS[inquiry.status]}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="text-slate-500 transition-colors hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-4 py-5 sm:px-6">
          <section className="space-y-3">
            <h3 className="text-xs tracking-wide text-slate-500">بيانات المرسل</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailField icon={User} label="الاسم" value={inquiry.name} />
              <DetailField icon={Mail} label="البريد الإلكتروني" value={inquiry.email} dir="ltr" />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs tracking-wide text-slate-500">
              <MessageSquare className="h-3.5 w-3.5" /> الرسالة
            </h3>
            <p className="whitespace-pre-wrap rounded-xl border border-black/5 bg-[#E8F4F8]/40 p-4 text-sm text-slate-800">
              {inquiry.message}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs tracking-wide text-slate-500">
              <Tag className="h-3.5 w-3.5" /> تحديث الحالة
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                id="inquiry-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as InquiryStatus)}
                disabled={isPending}
                className="flex-1 rounded-xl border border-slate-300 bg-white/60 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {INQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button
                id="inquiry-save-status"
                type="button"
                onClick={handleSaveStatus}
                disabled={isPending || status === inquiry.status}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                حفظ الحالة
              </button>
            </div>
          </section>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && !error && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
