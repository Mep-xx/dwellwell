// src/utils/api.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * We ONLY read VITE_API_BASE_URL from .env and require it to end with /api.
 * No defaults, no guessing.
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!RAW_BASE) {
  throw new Error('[api] Missing VITE_API_BASE_URL in .env (it must include /api).');
}

// normalize: remove trailing slashes ONLY (no appending)
const baseURL = RAW_BASE.replace(/\/+$/, '');
if (!/\/api$/.test(baseURL)) {
  throw new Error(`[api] VITE_API_BASE_URL must end with "/api". Got "${RAW_BASE}".`);
}

// ---- Token storage
export const ACCESS_TOKEN_KEY = 'dwellwell-token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore storage errors (SSR or disabled storage) */
  }
}

// ---- Axios instance (send cookies for refresh)
export const api = axios.create({
  baseURL,
  withCredentials: true, // needed so refresh cookie is sent
});

// Attach Authorization on every request (skip auth endpoints)
api.interceptors.request.use((config) => {
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  const token = getAccessToken();
  const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

  if (!isAuthEndpoint && token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // DEBUG:
  console.log('[api->]', (config.method || 'GET').toUpperCase(), url, {
    hasAuth: !isAuthEndpoint && !!token,
    tokenPrefix: token ? token.slice(0, 12) : null
  });

  return config;
});


// ---- 401 handler: refresh once, then retry original
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: any) => void }> = [];

async function refreshAccessToken(): Promise<string> {
  console.log('[api] refreshing…');
  const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
  console.log('[api] refresh OK, got accessToken?', !!data?.accessToken);
  if (isRefreshing) {
    return new Promise((resolve, reject) => queue.push({ resolve, reject }));
  }
  isRefreshing = true;
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken: string | undefined = data?.accessToken;
    if (!newToken) throw new Error('No accessToken in refresh response');
    setAccessToken(newToken);
    queue.forEach((p) => p.resolve(newToken));
    queue = [];
    return newToken;
  } catch (err) {
    queue.forEach((p) => p.reject(err));
    queue = [];
    setAccessToken(null);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status ?? 0;
    const url = `${original?.baseURL ?? ''}${original?.url ?? ''}`;
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    // Only refresh for non-auth endpoints, and only once
    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      console.log('[api] 401 from', original.url, '→ trying refresh');
      const token = await refreshAccessToken();
      console.log('[api] retrying', original.url, 'with new token prefix', token.slice(0,12));
      try {
        const token = await refreshAccessToken();
        original.headers = original.headers ?? {};
        (original.headers as any).Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
