import { api } from './api';

export interface FaqItem {
  key: string;
  value: string;
}

export interface ContentItem {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export function fetchFaq(): Promise<FaqItem[]> {
  return api.get<FaqItem[]>('/api/content/faq');
}

export function fetchContent(): Promise<ContentItem[]> {
  return api.get<ContentItem[]>('/api/content');
}

export function getContentValue(items: ContentItem[], key: string): string | null {
  return items.find((item) => item.key === key)?.value ?? null;
}

// ---------- Admin ----------
export function fetchAdminContent(): Promise<ContentItem[]> {
  return api.get<ContentItem[]>('/api/admin/content');
}

export function createContentEntry(payload: {
  key: string;
  value: string;
  description?: string;
}): Promise<ContentItem> {
  return api.post<ContentItem>('/api/admin/content', payload);
}

export function updateContentEntry(
  key: string,
  payload: { value?: string; description?: string },
): Promise<ContentItem> {
  return api.patch<ContentItem>(`/api/admin/content/${encodeURIComponent(key)}`, payload);
}

export function deleteContentEntry(id: number): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/api/admin/content/${id}`);
}
