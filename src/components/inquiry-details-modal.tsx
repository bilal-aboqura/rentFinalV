'use client';

/**
 * Spec 010 (F-10) — InquiryDetailsModal (US3)
 *
 * Modal showing the full inquiry details (name, email, subject, message)
 * plus a status dropdown (Unread / Read / Resolved). The parent remounts
 * this component with `key={inquiry.id}` so local form state initializes
 * cleanly per inquiry.
 *
 * Spec: specs/010-contact-inquiries/spec.md (FR-009, FR-010)
 */

import { useState, useTransition } from 'react';
import { X, Mail, User, MessageSquare, Tag, Loader2, AlertCircle } from 'lucide-react';
import { type ContactInquiry, type InquiryStatus, INQUIRY_STATUSES } from '@/lib/validation/contact';

interface Props {
  inquiry: ContactInquiry;
  onClose: () => void;
  onStatusChange: (inquiryId: string, status: InquiryStatus) => Promise<boolean>;
}

const STATUS_COLORS: Record<InquiryStatus, string> = {
  Unread: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Read: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

type FieldIcon = React.ComponentType<{ className?: string }>;

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: FieldIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-200 break-words">{value || '—'}</p>
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
        setError('Failed to update inquiry status. It may no longer exist.');
      } else {
        setSuccess('Status updated successfully.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">Inquiry Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">{inquiry.subject}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                STATUS_COLORS[inquiry.status]
              }`}
            >
              {inquiry.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Sender details */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">Sender</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField icon={User} label="Name" value={inquiry.name} />
              <DetailField icon={Mail} label="Email" value={inquiry.email} />
            </div>
          </section>

          {/* Message */}
          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </h3>
            <p className="text-sm text-slate-200 whitespace-pre-wrap bg-slate-900/40 rounded-xl p-4 border border-white/5">
              {inquiry.message}
            </p>
          </section>

          {/* Status update */}
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Update Status
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                id="inquiry-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as InquiryStatus)}
                disabled={isPending}
                className="flex-1 bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {INQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                id="inquiry-save-status"
                type="button"
                onClick={handleSaveStatus}
                disabled={isPending || status === inquiry.status}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Status
              </button>
            </div>
          </section>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && !error && (
            <div className="text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
