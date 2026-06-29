import { Outlet, NavLink } from 'react-router-dom';
import { Bus, Phone } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-bold text-brand-700">
            <Bus className="h-6 w-6" />
            <span>Airport Transfers</span>
          </NavLink>
          <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'
                }`
              }
            >
              Book
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `flex items-center gap-1 rounded-md px-3 py-2 transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'
                }`
              }
            >
              <Phone className="h-4 w-4" />
              Contact
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Airport Transfers. All rights reserved.</p>
      </footer>
    </div>
  );
}
