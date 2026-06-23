import axios, { AxiosError, type AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export interface ApiErrorResponse {
  error: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.error || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function isApiErrorStatus(error: unknown, status: number): boolean {
  return error instanceof AxiosError && error.response?.status === status;
}

export default api;
