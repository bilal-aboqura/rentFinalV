import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, fetchUnreadCount, markNotificationRead } from '../services/notifications';
import type { NotificationDTO } from '../types';

export function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetchUnreadCount().then(setUnread).catch(() => undefined);
      fetchNotifications().then(setItems).catch(() => undefined);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function toggleItem(item: NotificationDTO) {
    if (!item.read_status) {
      try {
        await markNotificationRead(item.id);
        setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read_status: true } : n)));
        setUnread((prev) => Math.max(0, prev - 1));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
            Notifications {unread > 0 && <span className="text-brand-600">({unread} new)</span>}
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-400">No notifications.</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => toggleItem(n)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left text-sm hover:bg-slate-50 ${n.read_status ? '' : 'bg-brand-50/50'}`}
                >
                  <span className="text-slate-700">{n.message}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString()}
                    {!n.read_status && <span className="ml-2 font-semibold text-brand-600">new</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
