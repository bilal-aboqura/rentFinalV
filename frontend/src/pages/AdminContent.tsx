import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Button, Card, Field, Input } from '../components/ui';
import {
  fetchAdminContent,
  createAdminContent,
  updateAdminContent,
  deleteAdminContent,
  type AdminContentEntry,
} from '../services/content';
import { getApiErrorMessage } from '../services/api';

export default function AdminContent() {
  const [entries, setEntries] = useState<AdminContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqError, setFaqError] = useState('');

  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customError, setCustomError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await fetchAdminContent());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load content.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddFaq(event: React.FormEvent) {
    event.preventDefault();
    setFaqError('');
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      setFaqError('Question and answer are required.');
      return;
    }
    try {
      const key = `faq_${Date.now()}`;
      const value = JSON.stringify({ question: faqQuestion.trim(), answer: faqAnswer.trim() });
      await createAdminContent({ key, value, description: 'FAQ entry' });
      setFaqQuestion('');
      setFaqAnswer('');
      await load();
    } catch (err) {
      setFaqError(getApiErrorMessage(err));
    }
  }

  async function handleAddCustom(event: React.FormEvent) {
    event.preventDefault();
    setCustomError('');
    if (!customKey.trim() || !customValue.trim()) {
      setCustomError('Key and value are required.');
      return;
    }
    try {
      await createAdminContent({ key: customKey.trim(), value: customValue.trim() });
      setCustomKey('');
      setCustomValue('');
      await load();
    } catch (err) {
      setCustomError(getApiErrorMessage(err));
    }
  }

  async function saveEntry(entry: AdminContentEntry) {
    const next = drafts[entry.id] ?? entry.value;
    try {
      await updateAdminContent(entry.id, { value: next });
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[entry.id];
        return copy;
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function remove(entry: AdminContentEntry) {
    if (!confirm(`Delete ${entry.key}?`)) return;
    try {
      await deleteAdminContent(entry.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Content &amp; FAQ</h1>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Add FAQ entry</h2>
          <form onSubmit={handleAddFaq} className="flex flex-col gap-3" noValidate>
            <Field label="Question" htmlFor="faq-q">
              <Input id="faq-q" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} />
            </Field>
            <Field label="Answer" htmlFor="faq-a">
              <textarea
                id="faq-a"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </Field>
            {faqError && <p role="alert" className="text-sm text-red-600">{faqError}</p>}
            <Button type="submit" className="w-full">Add FAQ</Button>
          </form>

          <h2 className="mb-4 mt-8 text-lg font-semibold text-slate-800">Add custom content</h2>
          <form onSubmit={handleAddCustom} className="flex flex-col gap-3" noValidate>
            <Field label="Key" htmlFor="custom-key" hint="e.g. hero_title">
              <Input id="custom-key" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
            </Field>
            <Field label="Value" htmlFor="custom-value">
              <textarea
                id="custom-value"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </Field>
            {customError && <p role="alert" className="text-sm text-red-600">{customError}</p>}
            <Button type="submit" variant="secondary" className="w-full">Add content</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Existing content</h2>
          {loading && <p className="py-6 text-center text-slate-400">Loading…</p>}
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-700">{entry.key}</span>
                  <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(entry)}>Delete</Button>
                </div>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={2}
                  defaultValue={entry.value}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    className="px-2 py-1 text-xs"
                    disabled={drafts[entry.id] === undefined}
                    onClick={() => saveEntry(entry)}
                  >
                    Save
                  </Button>
                </div>
              </li>
            ))}
            {!loading && entries.length === 0 && (
              <li className="py-6 text-center text-slate-400">No content yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </AdminLayout>
  );
}
