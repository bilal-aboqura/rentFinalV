import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSiteSettings } from '@/app/actions/cms';
import { createClient } from '@/lib/supabase/server';
import AdminNavbar from '@/components/admin-navbar';
import ContentSettingsForm from './content-settings-form';

export const metadata: Metadata = {
  title: 'Content - Admin',
};

export default async function AdminContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminNavbar activeTab="content" />
        <header>
          <h1 className="text-2xl font-bold">Content Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage public site text, brand colors, logo, and hero imagery.
          </p>
        </header>
        <ContentSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
