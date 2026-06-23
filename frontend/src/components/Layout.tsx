import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Plane } from 'lucide-react';

export function Layout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-700">
            <Plane className="h-5 w-5" />
            <span>Airport Transfers</span>
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkClass} end>Home</NavLink>
            <NavLink to="/booking" className={linkClass}>Book</NavLink>
            <NavLink to="/contact" className={linkClass}>Contact</NavLink>
            <NavLink to="/admin" className={linkClass}>Admin</NavLink>
          </nav>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-2 md:hidden">
            <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/booking" className={linkClass} onClick={() => setOpen(false)}>Book</NavLink>
            <NavLink to="/contact" className={linkClass} onClick={() => setOpen(false)}>Contact</NavLink>
            <NavLink to="/admin" className={linkClass} onClick={() => setOpen(false)}>Admin</NavLink>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children ?? <Outlet />}
      </main>
      <footer className="border-t border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Airport Transfers. All rights reserved.
      </footer>
    </div>
  );
}
