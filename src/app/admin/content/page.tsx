import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  getBankAccountsAction,
  getHospitalityOptionsAction,
  getSiteSettings,
} from '@/app/actions/cms';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin-shell';
import ContentSettingsForm from './content-settings-form';
import BankDetailsForm from './bank-details-form';
import HospitalityOptionsForm from './hospitality-options-form';

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

  const [settings, bankAccounts, hospitalityOptions] = await Promise.all([
    getSiteSettings(),
    getBankAccountsAction(),
    getHospitalityOptionsAction(),
  ]);

  return (
    <AdminShell userEmail={user.email}>
      <div className="mx-auto max-w-6xl space-y-6 text-slate-900">
        <header>
          <h1 className="text-2xl font-bold">إدارة المحتوى</h1>
          <p className="mt-1 text-sm text-slate-500">
            تحكم في نصوص الموقع العامة وألوان الهوية والشعار وصورة الواجهة الرئيسية.
          </p>
        </header>
        <ContentSettingsForm key={settings.updated_at} initialSettings={settings} />
        <BankDetailsForm
          initial={{
            bank_name: settings.bank_name,
            account_holder_name: settings.account_holder_name,
            iban: settings.iban,
            bank_qr_url: settings.bank_qr_url ?? '',
            whatsapp_number: settings.whatsapp_number,
          }}
          initialAccounts={bankAccounts}
        />
        <HospitalityOptionsForm initialOptions={hospitalityOptions} />
      </div>
    </AdminShell>
  );
}
