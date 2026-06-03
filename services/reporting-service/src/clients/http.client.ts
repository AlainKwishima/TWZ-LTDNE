import { getServiceUrls } from '../config/index.js';

interface FetchOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
}

interface ApiListResponse<T> {
  success?: boolean;
  data?: T[] | T;
  meta?: { total?: number };
}

function buildUrl(base: string, path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function fetchJson<T>(
  baseUrl: string,
  path: string,
  options: FetchOptions = {}
): Promise<T | null> {
  try {
    const url = buildUrl(baseUrl, path, options.params);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.warn(`[ServiceClient] ${url} returned ${response.status}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[ServiceClient] Failed to fetch ${path}:`, (error as Error).message);
    return null;
  }
}

export async function fetchList<T>(
  baseUrl: string,
  path: string,
  options: FetchOptions = {}
): Promise<T[]> {
  const json = await fetchJson<ApiListResponse<T>>(baseUrl, path, {
    ...options,
    params: { limit: 100, page: 1, ...options.params },
  });

  if (!json) return [];
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json)) return json as T[];
  return [];
}

export async function fetchListTotal(
  baseUrl: string,
  path: string,
  options: FetchOptions = {}
): Promise<number> {
  const json = await fetchJson<ApiListResponse<unknown>>(baseUrl, path, {
    ...options,
    params: { limit: 1, page: 1, ...options.params },
  });

  if (!json) return 0;
  if (typeof json.meta?.total === 'number') return json.meta.total;
  if (Array.isArray(json.data)) return json.data.length;
  return 0;
}

export function getUrls() {
  return getServiceUrls();
}
