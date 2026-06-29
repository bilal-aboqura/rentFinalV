'use client';

import { useState, useEffect, useTransition } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import type { Notification } from '@/types';
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/admin/dashboard/actions';

export default function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.read_status).length;

  const loadNotifications = () => {
    getNotificationsAction().then((res) => {
      if (res.success) setNotifications(res.data);
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
      );
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
    });
  };

  const typeLabel: Record<string, string> = {
    admin_new_booking: 'New Booking',
    customer_status_change: 'Status Change',
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        id="notifications-btn"
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-96 glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-5 py-4 border-b border-white/5 flex items-start gap-3 transition-colors ${
                      !n.read_status ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        !n.read_status ? 'bg-indigo-400' : 'bg-slate-600'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          {typeLabel[n.type] ?? n.type}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(n.created_at).toLocaleString('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed truncate">{n.message}</p>
                    </div>
                    {!n.read_status && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-slate-500 hover:text-indigo-400 flex-shrink-0 transition-colors"
                        aria-label="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
