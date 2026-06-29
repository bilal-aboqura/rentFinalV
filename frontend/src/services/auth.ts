import { api } from './api';

export interface AdminUser {
  username: string;
  role: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export function login(payload: LoginPayload): Promise<{ success: boolean; user: AdminUser }> {
  return api.post<{ success: boolean; user: AdminUser }>('/api/admin/login', payload);
}

export function logout(): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>('/api/admin/logout');
}

export function fetchSession(): Promise<{ user: AdminUser }> {
  return api.get<{ user: AdminUser }>('/api/admin/session');
}
