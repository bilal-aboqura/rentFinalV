import api from './api';
import type { NotificationDTO } from '../types';

export async function fetchNotifications(): Promise<NotificationDTO[]> {
  const { data } = await api.get<NotificationDTO[]>('/api/admin/notifications');
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/admin/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/api/admin/notifications/${id}/read`);
}
