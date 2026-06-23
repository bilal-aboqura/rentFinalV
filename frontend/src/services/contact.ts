import api from './api';

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/api/contact', input);
  return data;
}
