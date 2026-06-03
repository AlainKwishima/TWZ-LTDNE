import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, ExportFormat } from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const TOKEN_KEY = 'fems_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-otp', '/'].includes(path);
      if (!isAuthPage) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function downloadReportExport(reportId: string, format: ExportFormat): Promise<void> {
  const response = await api.get(`/reports/${reportId}/export/${format}`, {
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  let filename = `report.${format}`;
  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match?.[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function extractData<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data as T;
}

export function extractList<T>(response: { data: ApiResponse<T[]> }): { items: T[]; meta?: ApiResponse['meta'] } {
  return {
    items: (response.data.data ?? []) as T[],
    meta: response.data.meta,
  };
}
