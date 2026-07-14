import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminShell from '@/components/admin-shell';
import ProfileForm from './profile-form';

export const metadata = { title: 'الملف الشخصي | لوحة التحكم' };

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const fullName = typeof user.user_metadata.full_name === 'string'
    ? user.user_metadata.full_name
    : user.email?.split('@')[0] ?? '';

  return (
    <AdminShell userEmail={user.email}>
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الملف الشخصي</h1>
          <p className="mt-1 text-sm text-slate-500">تحديث اسم الحساب وكلمة المرور.</p>
        </div>
        <ProfileForm initialName={fullName} email={user.email ?? ''} />
      </div>
    </AdminShell>
  );
}
