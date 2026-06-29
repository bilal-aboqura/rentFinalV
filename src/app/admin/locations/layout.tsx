/**
 * Layout for /admin/locations — reuses dashboard-style sidebar navigation.
 * Protects all routes under /admin/locations behind auth.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Settings,
  FileText,
  LogOut,
  Plane,
  MapPin,
} from 'lucide-react';
import { adminLogoutAction } from '@/app/admin/dashboard/actions';
import NotificationsList from '@/components/notifications-list';

const NAV_LINKS = [
  { href: '/admin/dashboard/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/dashboard/drivers', label: 'Drivers', icon: Users },
  { href: '/admin/locations', label: 'Locations', icon: MapPin },
  { href: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/admin/dashboard/content', label: 'Content', icon: FileText },
];

export default async function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 glass border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">AirTransfer</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group text-sm font-medium"
            >
              <Icon className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          <div className="px-3 py-2 rounded-xl bg-slate-800/50">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm text-slate-300 font-medium truncate">{user.email}</p>
          </div>
          <form action={adminLogoutAction}>
            <button
              id="admin-logout-btn"
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="glass border-b border-white/10 px-8 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-slate-300 text-sm">
            Welcome back, <span className="text-white font-semibold">{user.email?.split('@')[0]}</span>
          </h2>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              id="view-site-link"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              View Site ↗
            </a>
            <NotificationsList />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
