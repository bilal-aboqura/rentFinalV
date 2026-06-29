import { api } from './api';
import type { NotificationType } from './types';

export interface NotificationItem {
  id: number;
  recipient_email: string | null;
  message: string;
  type: NotificationType;
  read_status: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  rows: NotificationItem[];
  unreadCount: number;
}

export function fetchNotifications(unreadOnly = false): Promise<NotificationsResponse> {
  const qs = unreadOnly ? '?unread=true' : '';
  return api.get<NotificationsResponse>(`/api/admin/notifications${qs}`);
}

export function markNotificationRead(id: number): Promise<{ success: boolean }> {
  return api.patch<{ success: boolean }>(`/api/admin/notifications/${id}/read`);
}

export function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>('/api/admin/notifications/read-all');
}
