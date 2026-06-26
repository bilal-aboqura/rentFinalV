'use client';

import React, { useState } from 'react';
import { ContactInquiry, updateInquiryStatusAction } from '@/app/admin/inquiries/actions';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InquiryDetailsModalProps {
  inquiry: ContactInquiry;
  onClose: () => void;
  onUpdate: (updated: ContactInquiry) => void;
}

export default function InquiryDetailsModal({
  inquiry,
  onClose,
  onUpdate,
}: InquiryDetailsModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ContactInquiry['status']>(inquiry.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ContactInquiry['status'];
    setStatus(newStatus);
    setIsUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await updateInquiryStatusAction({ inquiryId: inquiry.id, status: newStatus });
      if (res.success && res.data) {
        setSuccess(true);
        onUpdate(res.data);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(res.error || 'Failed to update status.');
        setStatus(inquiry.status); // revert
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStatus(inquiry.status); // revert
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (val: ContactInquiry['status']) => {
    switch (val) {
      case 'Unread':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Read':
        return 'bg-slate-900 border-slate-800 text-slate-400';
      case 'Resolved':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-950/30">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Inquiry Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submitted on {new Date(inquiry.created_at).toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick info row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">From</span>
              <span className="block font-medium text-white text-sm mt-1">{inquiry.name}</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Email</span>
              <a
                href={`mailto:${inquiry.email}`}
                className="block font-medium text-blue-400 hover:underline text-sm mt-1 truncate"
              >
                {inquiry.email}
              </a>
            </div>
          </div>

          <div>
            <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500">Subject</span>
            <span className="block font-medium text-white text-sm mt-1">{inquiry.subject}</span>
          </div>

          <div className="border-t border-slate-800/60 pt-4">
            <span className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Message</span>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {inquiry.message}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Status selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Status:</span>
            <div className="relative">
              <select
                value={status}
                onChange={handleStatusChange}
                disabled={isUpdating}
                className={`text-xs font-semibold rounded-lg border px-3 py-1.5 pr-8 bg-slate-950/80 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 appearance-none ${getStatusBadgeColor(
                  status
                )}`}
              >
                <option value="Unread">Unread</option>
                <option value="Read">Read</option>
                <option value="Resolved">Resolved</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-500">
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
            {success && (
              <span className="flex items-center gap-1 text-[11px] text-green-400 animate-pulse font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors duration-200 cursor-pointer text-center"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
