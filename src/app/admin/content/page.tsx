import AdminNavbar from '@/components/admin-navbar';
import AdminContentManager from '@/components/admin-content-manager';
import { getSiteSettings } from '@/app/actions/cms';

export default async function AdminContentPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminNavbar activeTab="content" />
      <AdminContentManager initialSettings={settings} />
    </main>
  );
}
