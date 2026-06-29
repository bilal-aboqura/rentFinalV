import type { Metadata } from 'next';
import { getContentAction } from '@/app/admin/dashboard/actions';
import ContentManager from './content-manager';

export const metadata: Metadata = { title: 'Content — Admin Dashboard' };

export default async function ContentPage() {
  const contentRes = await getContentAction();
  const content = contentRes.success ? contentRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Management</h1>
        <p className="text-slate-400 text-sm mt-1">
          Edit homepage content and FAQ items. Changes reflect immediately on the public site.
        </p>
      </div>
      <ContentManager content={content} />
    </div>
  );
}
