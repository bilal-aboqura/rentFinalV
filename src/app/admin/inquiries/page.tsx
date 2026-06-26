import React from 'react';
import { fetchInquiriesAction, ContactInquiry } from './actions';
import InquiriesManager from '@/components/inquiries-manager';
import AdminNavbar from '@/components/admin-navbar';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminInquiriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const pageParam = params.page;
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1;
  
  const statusParam = params.status;
  const statusFilter = typeof statusParam === 'string' ? statusParam : undefined;
  
  const limit = 10;

  let validStatus: ContactInquiry['status'] | undefined = undefined;
  if (statusFilter && ['Unread', 'Read', 'Resolved'].includes(statusFilter)) {
    validStatus = statusFilter as ContactInquiry['status'];
  }

  const inquiriesRes = await fetchInquiriesAction({
    page,
    limit,
    statusFilter: validStatus,
  });

  const inquiries = inquiriesRes.success && inquiriesRes.data ? inquiriesRes.data.inquiries : [];
  const totalCount = inquiriesRes.success && inquiriesRes.data ? inquiriesRes.data.totalCount : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <AdminNavbar activeTab="inquiries" />

      {/* Admin Content Area */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Customer Inquiries
            </h1>
            <p className="text-slate-400 text-base mt-2">
              Read customer messages and manage status updates for custom route requests and inquiries.
            </p>
          </div>

          <InquiriesManager
            initialInquiries={inquiries}
            totalCount={totalCount}
            currentPage={page}
            limit={limit}
            initialStatusFilter={validStatus || 'All'}
          />
        </div>
      </div>
    </main>
  );
}
