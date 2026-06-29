import { useEffect, useState } from 'react';
import { FileText, Plus, Save, Trash2, RefreshCw } from 'lucide-react';
import {
  fetchAdminContent,
  createContentEntry,
  updateContentEntry,
  deleteContentEntry,
  type ContentItem,
} from '../services/content';

export function AdminContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminContent();
      setItems(data);
      setDrafts(Object.fromEntries(data.map((d) => [d.id, d.value])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(item: ContentItem) {
    setSavingId(item.id);
    setError(null);
    try {
      await updateContentEntry(item.key, { value: drafts[item.id] ?? item.value });
      setItems((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, value: drafts[item.id] ?? item.value } : c,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save content.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(item: ContentItem) {
    if (!confirm(`Delete content "${item.key}"?`)) return;
    try {
      await deleteContentEntry(item.id);
      setItems((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content.');
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createContentEntry({ key: newKey, value: newValue });
      setItems((prev) => [...prev, created]);
      setDrafts((prev) => ({ ...prev, [created.id]: created.value }));
      setNewKey('');
      setNewValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add content.');
    } finally {
      setAdding(false);
    }
  }

  function isFaq(item: ContentItem): boolean {
    return item.key.startsWith('faq_');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Management</h1>
          <p className="text-sm text-slate-500">Edit homepage hero text and FAQ entries.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* Add new content */}
      <form
        onSubmit={handleAdd}
        className="space-y-3 rounded-xl bg-white p-4 shadow ring-1 ring-slate-200"
      >
        <h2 className="flex items-center gap-2 font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-brand-600" /> Add Content
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            placeholder="key (e.g. faq_4)"
            required
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            placeholder="value"
            required
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 sm:col-span-2"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add Entry'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow ring-1 ring-slate-200">
            Loading content…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500 shadow ring-1 ring-slate-200">
            No content entries yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl bg-white p-4 shadow ring-1 ring-slate-200"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {item.key}
                  </span>
                  {isFaq(item) && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      FAQ
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item)}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {item.description && (
                <p className="mb-1 text-xs text-slate-400">{item.description}</p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea
                  rows={isFaq(item) ? 3 : 2}
                  value={drafts[item.id] ?? item.value}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  onClick={() => handleSave(item)}
                  disabled={savingId === item.id}
                  className="flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60 sm:self-start"
                >
                  <Save className="h-4 w-4" /> {savingId === item.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
