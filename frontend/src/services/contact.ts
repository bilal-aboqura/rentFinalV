import { api } from './api';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export function submitContact(payload: ContactPayload): Promise<ContactResponse> {
  return api.post<ContactResponse>('/api/contact', payload);
}
