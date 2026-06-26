'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ContactInquiry } from '@/app/admin/inquiries/actions';
import InquiryDetailsModal from './inquiry-details-modal';
import { ChevronLeft, ChevronRight, Eye, Copy, Check, Filter } from 'lucide-react';

interface InquiriesManagerProps {
  initialInquiries: ContactInquiry[];
  totalCount: number;
  currentPage: number;
  limit: number;
  initialStatusFilter: string;
}

export default function InquiriesManager({
  initialInquiries,
  totalCount,
  currentPage,
  limit,
  initialStatusFilter,
}: InquiriesManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [prevInitialInquiries, setPrevInitialInquiries] = useState(initialInquiries);
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (initialInquiries !== prevInitialInquiries) {
    setPrevInitialInquiries(initialInquiries);
    setInquiries(initialInquiries);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status !== 'All') {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation(); // Avoid triggering row click to open modal
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleUpdateInquiry = (updatedInquiry: ContactInquiry) => {
    setInquiries((prev) =>
      prev.map((i) => (i.id === updatedInquiry.id ? updatedInquiry : i))
    );
    if (selectedInquiry && selectedInquiry.id === updatedInquiry.id) {
      setSelectedInquiry(updatedInquiry);
    }
    router.refresh();
  };

  const getStatusBadgeClass = (status: ContactInquiry['status']) => {
    switch (status) {
      case 'Unread':
        return 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Read':
        return 'bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      case 'Resolved':
        return 'bg-green-500/10 border border-green-500/20 text-green-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
      default:
        return 'bg-slate-900 border border-slate-800 text-slate-400 font-semibold rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 w-fit';
    }
  };

  const statuses = ['All', 'Unread', 'Read', 'Resolved'];

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold uppercase tracking-wider text-xs">Filter by Status</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border ${
                initialStatusFilter === status || (status === 'All' && !initialStatusFilter)
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Sender</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Submitted At</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-sm">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                    No inquiries found. Excellent!
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="hover:bg-slate-800/25 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-medium text-white">{inquiry.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 group-hover:text-blue-400 transition-colors">{inquiry.email}</span>
                        <button
                          onClick={(e) => handleCopyEmail(e, inquiry.email)}
                          className="text-slate-500 hover:text-white p-1 hover:bg-slate-850 rounded transition-all cursor-pointer"
                          title="Copy Email Address"
                        >
                          {copiedEmail === inquiry.email ? (
                            <Check className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200 max-w-xs truncate">
                      {inquiry.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white">{new Date(inquiry.created_at).toLocaleDateString()}</span>
                      <span className="text-slate-500 block text-xs mt-0.5">
                        {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={getStatusBadgeClass(inquiry.status)}>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inquiry.status === 'Unread'
                              ? 'bg-blue-400 animate-pulse'
                              : inquiry.status === 'Read'
                              ? 'bg-slate-500'
                              : 'bg-green-400'
                          }`}
                        />
                        <span>{inquiry.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInquiry(inquiry);
                        }}
                        title="View Full Message & Manage"
                        className="p-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 font-medium text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">
              Showing Page {currentPage} of {totalPages} ({totalCount} total inquiries)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageChange(currentPage - 1);
                }}
                disabled={currentPage === 1}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePageChange(currentPage + 1);
                }}
                disabled={currentPage === totalPages}
                className="p-2 bg-slate-850 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-850 border border-slate-800 text-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Details Modal */}
      {selectedInquiry && (
        <InquiryDetailsModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onUpdate={handleUpdateInquiry}
        />
      )}
    </div>
  );
}
