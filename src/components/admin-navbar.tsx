import Link from 'next/link';
import { getPendingBookingsCount } from '@/app/admin/bookings/actions';
import { getUnreadInquiriesCount } from '@/app/admin/inquiries/actions';

export type AdminTab = 'bookings' | 'inquiries' | 'locations' | 'pricing' | 'drivers' | 'content';

const TABS: { key: AdminTab; label: string; href: string }[] = [
  { key: 'bookings', label: 'الحجوزات', href: '/admin/bookings' },
  { key: 'inquiries', label: 'الاستفسارات', href: '/admin/inquiries' },
  { key: 'locations', label: 'المواقع', href: '/admin/locations' },
  { key: 'pricing', label: 'الأسعار', href: '/admin/pricing' },
  { key: 'drivers', label: 'السائقون', href: '/admin/drivers' },
  { key: 'content', label: 'المحتوى', href: '/admin/content' },
];

export default async function AdminNavbar({ activeTab }: { activeTab: AdminTab }) {
  const [bookingsResult, inquiriesResult] = await Promise.all([
    getPendingBookingsCount(),
    getUnreadInquiriesCount(),
  ]);
  const pendingCount = bookingsResult.success ? bookingsResult.data.count : 0;
  const unreadCount = inquiriesResult.success ? inquiriesResult.data.count : 0;

  return (
    <nav
      aria-label="التنقل داخل لوحة الإدارة"
      className="-mx-1 flex items-center gap-1 overflow-x-auto rounded-xl border border-black/10 bg-[var(--cms-surface)] p-1.5 sm:mx-0 sm:gap-2 sm:rounded-2xl"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:rounded-xl sm:px-4 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-500 hover:bg-black/5 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.key === 'bookings' && (
              <span
                title={`${pendingCount} حجوزات قيد الانتظار`}
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  pendingCount > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {pendingCount}
              </span>
            )}
            {tab.key === 'inquiries' && (
              <span
                title={`${unreadCount} رسائل غير مقروءة`}
                className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
