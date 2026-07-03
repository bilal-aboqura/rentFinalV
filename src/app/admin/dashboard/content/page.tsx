import type { Metadata } from 'next';
import { getContentAction } from '@/app/admin/dashboard/actions';
import ContentManager from './content-manager';

export const metadata: Metadata = { title: 'المحتوى - لوحة التحكم' };

export default async function ContentPage() {
  const contentRes = await getContentAction();
  const content = contentRes.success ? contentRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">إدارة المحتوى</h1>
        <p className="mt-1 text-sm text-slate-500">
          عدّل محتوى الصفحة الرئيسية والعناصر النصية، وستظهر التغييرات مباشرة على الموقع العام.
        </p>
      </div>
      <ContentManager content={content} />
    </div>
  );
}
