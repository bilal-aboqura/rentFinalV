'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Content } from '@/types';
import { updateContentAction } from '@/app/admin/dashboard/actions';
import { Save, Loader2, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';

interface Props {
  content: Content[];
}

export default function ContentManager({ content }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [savedKey, setSavedKey] = useState('');

  const handleChange = (key: string, value: string) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string) => {
    setError('');
    setSavedKey('');
    startTransition(async () => {
      const result = await updateContentAction({ key, value: editing[key] ?? '' });
      if (result.success) {
        setSavedKey(key);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const getValue = (item: Content) => editing[item.key] ?? item.value;

  const heroItems = content.filter((c) => c.key.startsWith('hero_'));
  const faqItems = content.filter((c) => c.key.startsWith('faq_'));
  const otherItems = content.filter(
    (c) => !c.key.startsWith('hero_') && !c.key.startsWith('faq_')
  );

  const renderItem = (item: Content) => (
    <div key={item.key} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-500">
          <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700" dir="ltr">
            {item.key}
          </span>
          {item.description && <span className="text-slate-500">{item.description}</span>}
        </label>
        {savedKey === item.key && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle className="h-3 w-3" /> تم الحفظ
          </span>
        )}
      </div>
      {item.value.length > 80 ? (
        <textarea
          id={`content-${item.key}`}
          rows={3}
          value={getValue(item)}
          onChange={(e) => handleChange(item.key, e.target.value)}
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      ) : (
        <input
          id={`content-${item.key}`}
          type="text"
          value={getValue(item)}
          onChange={(e) => handleChange(item.key, e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
      )}
      <button
        id={`save-content-${item.key}`}
        onClick={() => handleSave(item.key)}
        disabled={isPending || getValue(item) === item.value}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white transition-all hover:bg-indigo-500 disabled:opacity-40"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        حفظ
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {heroItems.length > 0 && (
        <div className="glass space-y-5 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Edit2 className="h-4 w-4 text-indigo-500" />
            محتوى الواجهة الرئيسية
          </h3>
          {heroItems.map(renderItem)}
        </div>
      )}

      {faqItems.length > 0 && (
        <div className="glass space-y-5 rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Edit2 className="h-4 w-4 text-indigo-500" />
            الأسئلة الشائعة
          </h3>
          {faqItems.map(renderItem)}
        </div>
      )}

      {otherItems.length > 0 && (
        <div className="glass space-y-5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-900">محتوى إضافي</h3>
          {otherItems.map(renderItem)}
        </div>
      )}

      {content.length === 0 && (
        <div className="glass rounded-2xl py-16 text-center text-slate-500">
          لا توجد عناصر محتوى حالياً. شغّل ترحيل قاعدة البيانات لإضافة القيم الافتراضية.
        </div>
      )}
    </div>
  );
}
