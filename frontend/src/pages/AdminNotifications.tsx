import { useEffect, useState } from 'react';
import { CheckCheck, RefreshCw } from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../services/notifications';

export function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchNotifications();
      setItems(res.rows);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleMarkRead(item: NotificationItem) {
    if (item.read_status) return;
    await markNotificationRead(item.id);
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read_status: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read_status: true })));
    setUnreadCount(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow ring-1 ring-slate-200">
        {loading ? (
          <p className="px-4 py-8 text-center text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">No notifications.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMarkRead(item)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                item.read_status ? 'opacity-60' : 'bg-brand-50/40'
              }`}
            >
              {!item.read_status && (
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {item.type.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-slate-700">{item.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
