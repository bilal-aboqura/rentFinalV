import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bus, CalendarCheck, Users, Settings, FileText, Bell, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminNotifications } from './AdminNotifications';

const NAV = [
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/drivers', label: 'Drivers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/content', label: 'Content', icon: FileText },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 font-bold text-brand-700">
          <Bus className="h-6 w-6" />
          <span>Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavItem to="/admin" end icon={LayoutDashboard} label="Dashboard" />
          {NAV.map((item) => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="mb-2 px-2 text-xs text-slate-500">
            Signed in as <span className="font-semibold text-slate-700">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-2 border-b border-slate-200 bg-white px-4 py-2">
          <span className="mr-auto flex items-center gap-2 font-bold text-brand-700 md:hidden">
            <Bus className="h-5 w-5" /> Admin
          </span>
          <AdminNotifications />
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 md:hidden"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-x-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
