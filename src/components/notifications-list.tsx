'use client';

import { useEffect, useState, useTransition } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import type { Notification } from '@/types';
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/admin/dashboard/actions';

export default function NotificationsList() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((notification) => !notification.read_status).length;

  const loadNotifications = () => {
    getNotificationsAction().then((res) => {
      if (res.success) {
        setNotifications(res.data);
      }
    });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read_status: true } : notification
        )
      );
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read_status: true }))
      );
    });
  };

  const typeLabel: Record<string, string> = {
    admin_new_booking: 'حجز جديد',
    customer_status_change: 'تغيير حالة',
  };

  return (
    <div className="relative">
      <button
        id="notifications-btn"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            loadNotifications();
          }
        }}
        className="btn-secondary relative inline-flex p-3 text-slate-700"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--cms-primary)] px-1 text-[0.68rem] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-28 z-50 max-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/60 bg-white/92 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:absolute sm:inset-auto sm:left-0 sm:top-14 sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-[28px]">
            <div className="flex flex-col gap-3 border-b border-black/6 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold tracking-[0.22em] text-slate-500">
                  الإشعارات
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {unreadCount > 0
                    ? `${unreadCount} تحديثات غير مقروءة`
                    : 'كل شيء محدّث'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    id="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                    disabled={isPending}
                    className="btn-secondary inline-flex px-3 py-2 text-xs font-semibold"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    تعيين الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-black/5 hover:text-slate-950"
                  aria-label="إغلاق الإشعارات"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-3 sm:max-h-[28rem]">
              {notifications.length === 0 ? (
                <div className="soft-card p-5 text-center">
                  <p className="text-sm font-semibold text-slate-950">لا توجد إشعارات بعد</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    ستظهر هنا الحجوزات الجديدة وتحديثات الحالة للمتابعة السريعة.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`soft-card p-4 ${
                        !notification.read_status ? 'ring-1 ring-[var(--cms-primary)]/12' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            notification.read_status ? 'bg-slate-300' : 'bg-[var(--cms-primary)]'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.18em] text-slate-600">
                              {typeLabel[notification.type] ?? notification.type}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(notification.created_at).toLocaleString('ar-EG', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {notification.message}
                          </p>
                        </div>

                        {!notification.read_status && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-950"
                            aria-label="تعيين كمقروء"
                          >
                            تمّت القراءة
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
