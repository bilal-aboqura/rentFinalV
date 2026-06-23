import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarCheck, Users, Settings, FileText, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminNotifications } from './AdminNotifications';

const navItems = [
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/admin/drivers', label: 'Drivers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/content', label: 'Content', icon: FileText },
];

export function AdminLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white px-4 py-6 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center gap-2 px-2 text-lg font-bold text-brand-700">
          <LayoutDashboard className="h-5 w-5" />
          <span>Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-6">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Signed in as <strong>{user?.username ?? 'admin'}</strong>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-slate-800">Admin</span>
          </div>
          <span className="hidden text-sm text-slate-400 md:block">Airport Transfers Admin</span>
          <AdminNotifications />
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
