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

  // Group content by type
  const heroItems = content.filter((c) => c.key.startsWith('hero_'));
  const faqItems = content.filter((c) => c.key.startsWith('faq_'));
  const otherItems = content.filter(
    (c) => !c.key.startsWith('hero_') && !c.key.startsWith('faq_')
  );

  const renderItem = (item: Content) => (
    <div key={item.key} className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-400">
          <span className="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 mr-2">
            {item.key}
          </span>
          {item.description && <span className="text-slate-500">{item.description}</span>}
        </label>
        {savedKey === item.key && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Saved
          </span>
        )}
      </div>
      {item.value.length > 80 ? (
        <textarea
          id={`content-${item.key}`}
          rows={3}
          value={getValue(item)}
          onChange={(e) => handleChange(item.key, e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
        />
      ) : (
        <input
          id={`content-${item.key}`}
          type="text"
          value={getValue(item)}
          onChange={(e) => handleChange(item.key, e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
        />
      )}
      <button
        id={`save-content-${item.key}`}
        onClick={() => handleSave(item.key)}
        disabled={isPending || getValue(item) === item.value}
        className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-all"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        Save
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {heroItems.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-400" />
            Hero Section
          </h3>
          {heroItems.map(renderItem)}
        </div>
      )}

      {faqItems.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-indigo-400" />
            FAQ Items
          </h3>
          {faqItems.map(renderItem)}
        </div>
      )}

      {otherItems.length > 0 && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white">Other Content</h3>
          {otherItems.map(renderItem)}
        </div>
      )}

      {content.length === 0 && (
        <div className="glass rounded-2xl py-16 text-center text-slate-500">
          No content entries found. Run the database migration to seed default content.
        </div>
      )}
    </div>
  );
}
