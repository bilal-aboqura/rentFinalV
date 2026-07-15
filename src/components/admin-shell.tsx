import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarCheck,
  Car,
  DollarSign,
  FileText,
  LogOut,
  MapPin,
  Plane,
  Settings,
  UserCog,
  Users,
} from 'lucide-react';
import { adminLogoutAction } from '@/app/admin/dashboard/actions';
import AdminThemeToggle from '@/components/admin-theme-toggle';
import NotificationsList from '@/components/notifications-list';

const NAV_LINKS = [
  { href: '/admin/profile', label: 'الملف الشخصي', icon: UserCog },
  { href: '/admin/bookings', label: 'الحجوزات', icon: CalendarCheck },
  { href: '/admin/inquiries', label: 'الاستفسارات', icon: FileText },
  { href: '/admin/drivers', label: 'السائقون', icon: Users },
  { href: '/admin/cars', label: 'السيارات', icon: Car },
  { href: '/admin/locations', label: 'المواقع', icon: MapPin },
  { href: '/admin/pricing', label: 'الأسعار', icon: DollarSign },
  { href: '/admin/content', label: 'المحتوى', icon: Settings },
];

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail?: string | null;
  children: ReactNode;
}) {
  const today = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'full' }).format(new Date());

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50">
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-3 p-3 sm:gap-5 sm:p-6 xl:flex-row">
        <aside className="admin-panel flex w-full shrink-0 flex-col gap-3 p-3 sm:gap-6 sm:p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:w-[310px]">
          <div className="panel-card px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex items-center gap-3">
              {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--cms-primary)]/12">
                <Plane className="h-5 w-5 text-[var(--cms-primary)]" />
              </div> */}
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-950">دقه الوقت</h1>
              </div>
            </div>
            <p className="mt-4 hidden text-sm leading-7 text-slate-600 sm:block">
              مساحة عمل أبسط لإدارة الحجوزات والمحتوى والعمليات اليومية بشكل مريح وواضح.
            </p>
          </div>

          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-1 xl:flex-col xl:overflow-visible xl:px-0">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                id={`nav-${href.split('/').pop()}`}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-950 sm:gap-3 sm:px-4 sm:py-3 xl:min-w-0 xl:shrink"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-9 sm:w-9">
                  <Icon className="h-4 w-4 text-[var(--cms-primary)]" />
                </div>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="hidden rounded-xl border border-slate-200 bg-slate-50 p-5 xl:block">
            <p className="text-sm font-medium text-slate-500">وصول سريع</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              هل تريد مراجعة الواجهة العامة أثناء تعديل المحتوى أو الأسعار؟
            </p>
            <a
              href="/"
              target="_blank"
              id="view-site-link"
              className="btn-primary mt-5 inline-flex w-full px-4 py-3 text-sm font-semibold"
            >
              عرض الموقع العام
            </a>
          </div>

          <div className="mt-auto space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-medium text-slate-500">مسجل الدخول باسم</p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950" dir="ltr">
                {userEmail ?? 'Admin'}
              </p>
            </div>

            <form action={adminLogoutAction}>
              <button
                id="admin-logout-btn"
                type="submit"
                className="btn-secondary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-5">
          <header className="panel-card flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">العمليات اليومية</p>
              <h2 className="mt-1 break-words text-xl font-semibold text-slate-950 sm:text-2xl">
                أهلاً بعودتك، {userEmail?.split('@')[0] ?? 'admin'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{today}</p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 self-start sm:w-auto sm:flex-nowrap sm:gap-3 sm:self-center">
              <a
                href="/"
                target="_blank"
                className="btn-secondary inline-flex flex-1 px-4 py-3 text-sm font-semibold sm:flex-none xl:hidden"
              >
                عرض الموقع العام
              </a>
              <NotificationsList />
              <AdminThemeToggle />
            </div>
          </header>

          <main className="panel-card min-h-[calc(100vh-11rem)] flex-1 overflow-x-clip p-3 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
