// dwellwell-client/src/utils/api.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { apiLogout } from '@/utils/logoutHelper';

const baseURL =
  (import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:4000/api');

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ----------------------------------------------------------------------------
// Token helpers
// ----------------------------------------------------------------------------
const ACCESS_TOKEN_KEY = 'dwellwell-token';
const USER_KEY = 'dwellwell-user';

export function getToken() {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string) {
  try { localStorage.setItem(ACCESS_TOKEN_KEY, token); } catch {}
}
export function clearToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    // do NOT clear user here; AuthContext handles it on logout so UI updates correctly
  } catch {}
}

if (import.meta.env.DEV) {
  api.interceptors.request.use((cfg) => {
    // small and safe
    console.debug("API →", cfg.method?.toUpperCase(), cfg.url, cfg.data ?? "");
    return cfg;
  });
  api.interceptors.response.use(
    (r) => {
      console.debug("API ←", r.status, r.config.url);
      return r;
    },
    (e) => {
      const s = e?.response?.status;
      const u = e?.config?.url;
      console.warn("API ←", s, u, e?.response?.data ?? "");
      return Promise.reject(e);
    }
  );
}


// ----------------------------------------------------------------------------
// Attach token to requests
// ----------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----------------------------------------------------------------------------
// 401 auto-refresh logic with request queue
// ----------------------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(newToken: string | null) {
  pendingQueue.forEach((resolve) => resolve(newToken));
  pendingQueue = [];
}

async function refreshAccess(): Promise<string | null> {
  try {
    const resp = await axios.post<{ accessToken: string }>(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const t = resp.data?.accessToken || null;
    if (t) setToken(t);
    return t;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ✅ Never try to auto-refresh if the request that failed is /auth/refresh
    const url = (original?.url || '').toString();
    if (url.includes('/auth/refresh')) {
      // Do NOT redirect here; just let the caller (AuthContext on mount) decide.
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const code = (error.response?.data as any)?.error;

    const isAuthErr = status === 401;
    const eligible = isAuthErr && (code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED');

    if (!eligible || original?._retry) {
      // Hard fail: if this looks like auth loss, log out
      if (status === 401) {
        clearToken();
        const params = new URLSearchParams({ reason: 'expired' });
        window.location.replace(`/login?${params.toString()}`);
      }
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken) return reject(error);
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccess();
    isRefreshing = false;

    flushQueue(newToken);

    if (!newToken) {
      clearToken();
      const params = new URLSearchParams({ reason: 'expired' });
      window.location.replace(`/login?${params.toString()}`);
      return Promise.reject(error);
    }

    original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
    return api(original);
  }
);