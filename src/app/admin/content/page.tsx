import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getHomepagePriceCards, getSiteSettings } from '@/app/actions/cms';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin-shell';
import ContentSettingsForm from './content-settings-form';

export const metadata: Metadata = {
  title: 'إدارة المحتوى - لوحة التحكم',
};

export default async function AdminContentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const [settings, priceCards] = await Promise.all([getSiteSettings(), getHomepagePriceCards()]);

  return (
    <AdminShell userEmail={user.email}>
      <div className="mx-auto max-w-6xl space-y-6 text-slate-900">
        <header>
          <h1 className="text-2xl font-bold">إدارة المحتوى</h1>
          <p className="mt-1 text-sm text-slate-500">
            تحكم في نصوص الموقع العامة وألوان الهوية والشعار وصورة الواجهة الرئيسية.
          </p>
        </header>
        <ContentSettingsForm
          key={`${settings.updated_at}-${priceCards.map((card) => card.updated_at).join('-')}`}
          initialSettings={settings}
          initialPriceCards={priceCards}
        />
      </div>
    </AdminShell>
  );
}
