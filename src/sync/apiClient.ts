// Thin REST client for the ARISE Django backend. Base URL is optional —
// when unset, the app is purely offline (sync is additive, never required).
import { getAccess, getRefresh, saveAccess, clearTokens, saveTokens } from './secureTokens';

let baseUrl: string | null = process.env.EXPO_PUBLIC_API_URL ?? null;

export function setApiBaseUrl(url: string | null) {
  baseUrl = url && url.trim() ? url.trim().replace(/\/+$/, '') : null;
}

export function getApiBaseUrl(): string | null {
  return baseUrl;
}

export function isSyncConfigured(): boolean {
  return baseUrl !== null;
}

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  if (!baseUrl) throw new Error('Sync não configurado (defina o servidor).');
  return fetch(`${baseUrl}${path}`, init);
}

async function refreshAccess(): Promise<string | null> {
  const refresh = await getRefresh();
  if (!refresh) return null;
  const res = await rawFetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    await clearTokens();
    return null;
  }
  const data = (await res.json()) as { access: string; refresh?: string };
  if (data.refresh) await saveTokens(data.access, data.refresh);
  else await saveAccess(data.access);
  return data.access;
}

interface RequestOpts {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return rawFetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let token = auth ? await getAccess() : null;
  let res = await doFetch(token);

  if (res.status === 401 && auth) {
    token = await refreshAccess();
    if (token) res = await doFetch(token);
  }

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, parsed);
  return parsed as T;
}

export const api = {
  async register(username: string, password: string, email?: string) {
    const data = await request<{ access: string; refresh: string }>('/auth/register', {
      method: 'POST',
      auth: false,
      body: { username, password, email },
    });
    await saveTokens(data.access, data.refresh);
    return data;
  },
  async login(username: string, password: string) {
    const data = await request<{ access: string; refresh: string }>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { username, password },
    });
    await saveTokens(data.access, data.refresh);
    return data;
  },
  async logout() {
    await clearTokens();
  },
  me() {
    return request<unknown>('/me');
  },
  push(payload: unknown) {
    return request<{ server_time: string }>('/sync/push', { method: 'POST', body: payload });
  },
  pull(since?: string | null) {
    const q = since ? `?since=${encodeURIComponent(since)}` : '';
    return request<Record<string, unknown>>(`/sync/pull${q}`);
  },
  reportViolation(packageName: string) {
    return request<unknown>('/violations', { method: 'POST', body: { package_name: packageName } });
  },
  // Whole-app snapshot sync (single-user backup/restore, last-write-wins).
  getState() {
    return request<{ data: Record<string, unknown> | null; client_updated_at: number }>('/sync/state');
  },
  putState(data: Record<string, unknown>, clientUpdatedAt: number) {
    return request<{ stored: boolean; client_updated_at: number }>('/sync/state', {
      method: 'PUT',
      body: { data, client_updated_at: clientUpdatedAt },
    });
  },
};

export { ApiError };
