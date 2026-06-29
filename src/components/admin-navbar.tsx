import Link from 'next/link';
import { getPendingBookingsCount } from '@/app/admin/bookings/actions';

/**
 * Spec 008 (F-08) — AdminNavbar (T008 / US2)
 *
 * Reusable React Server Component rendered across every admin page.
 * Fetches the current count of pending bookings and renders a badge
 * next to the "Bookings" link so administrators can see new requests
 * at a glance.
 *
 * Spec: specs/008-new-request-alert/research.md#3
 */

export type AdminTab = 'bookings' | 'locations' | 'pricing' | 'drivers';

const TABS: { key: AdminTab; label: string; href: string }[] = [
  { key: 'bookings', label: 'Bookings', href: '/admin/bookings' },
  { key: 'locations', label: 'Locations', href: '/admin/locations' },
  { key: 'pricing', label: 'Pricing', href: '/admin/pricing' },
  { key: 'drivers', label: 'Drivers', href: '/admin/drivers' },
];

export default async function AdminNavbar({ activeTab }: { activeTab: AdminTab }) {
  const result = await getPendingBookingsCount();
  const pendingCount = result.success ? result.data.count : 0;

  return (
    <nav
      aria-label="Admin navigation"
      className="flex items-center gap-1 sm:gap-2 flex-wrap p-1.5 rounded-2xl bg-slate-900/60 border border-white/10"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
            {tab.key === 'bookings' && (
              <span
                title={`${pendingCount} pending booking${pendingCount === 1 ? '' : 's'}`}
                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-bold ${
                  pendingCount > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
