import api from './api';

export interface FaqEntry {
  key: string;
  value: { question: string; answer: string };
}

export interface ContentEntry {
  key: string;
  value: string;
}

export async function fetchFaq(): Promise<FaqEntry[]> {
  const { data } = await api.get<ContentEntry[]>('/api/content/faq');
  return data.map((entry) => {
    try {
      return { key: entry.key, value: JSON.parse(entry.value) };
    } catch {
      return { key: entry.key, value: { question: entry.key, answer: entry.value } };
    }
  });
}

export async function fetchContent(): Promise<Record<string, string>> {
  const { data } = await api.get<ContentEntry[]>('/api/content');
  return Object.fromEntries(data.map((entry) => [entry.key, entry.value]));
}

export interface AdminContentEntry {
  id: number;
  key: string;
  value: string;
  description: string | null;
}

export async function fetchAdminContent(): Promise<AdminContentEntry[]> {
  const { data } = await api.get<AdminContentEntry[]>('/api/admin/content');
  return data;
}

export async function createAdminContent(input: {
  key: string;
  value: string;
  description?: string;
}): Promise<AdminContentEntry> {
  const { data } = await api.post<AdminContentEntry>('/api/admin/content', input);
  return data;
}

export async function updateAdminContent(
  id: number,
  input: Partial<{ value: string; description: string }>,
): Promise<AdminContentEntry> {
  const { data } = await api.patch<AdminContentEntry>(`/api/admin/content/${id}`, input);
  return data;
}

export async function deleteAdminContent(id: number): Promise<void> {
  await api.delete(`/api/admin/content/${id}`);
}
