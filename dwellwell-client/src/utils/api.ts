// dwellwell-client/src/utils/api.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { apiLogout } from '@/utils/logoutHelper';

// ----------------------------------------------------------------------------
// Axios instance
// ----------------------------------------------------------------------------
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // needed for refresh cookie
  timeout: 30000,
});

// ----------------------------------------------------------------------------
// Token storage helpers
// ----------------------------------------------------------------------------
const ACCESS_TOKEN_KEY = 'dwellwell-token';

function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
}
function setToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ----------------------------------------------------------------------------
// Light client-side session helpers
// ----------------------------------------------------------------------------
function redirectToLoginWithQuery(reason: 'expired' | 'unauth') {
  const url = new URL(window.location.href);
  const isAlreadyOnLogin = url.pathname.startsWith('/login');
  if (isAlreadyOnLogin) return;
  const qs = new URLSearchParams({ reason }).toString();
  window.location.assign(`/login?${qs}`);
}

function safeClientClear() {
  try {
    clearToken();
  } catch {}
}

let hasShownBackendError = false;
function backendDownToastOnce() {
  if (hasShownBackendError) return;
  hasShownBackendError = true;
  toast({
    title: 'Server unavailable',
    description: 'The API did not respond. Please try again in a moment.',
    variant: 'destructive',
  });
  setTimeout(() => (hasShownBackendError = false), 10_000);
}

// ----------------------------------------------------------------------------
// Attach Authorization header
// ----------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// ----------------------------------------------------------------------------
// Refresh management (fan-in concurrent 401→refresh)
// ----------------------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: Array<(t: string) => void> = [];

function enqueue(cb: (t: string) => void) {
  pendingQueue.push(cb);
}
function flushQueue(newToken: string) {
  pendingQueue.forEach((fn) => fn(newToken));
  pendingQueue = [];
}

async function performRefresh(): Promise<string> {
  const { data } = await api.post('/auth/refresh'); // cookie-based
  const newToken = data?.accessToken as string | undefined;
  if (!newToken) throw new Error('No accessToken returned by refresh');
  setToken(newToken);
  return newToken;
}

// ----------------------------------------------------------------------------
// Response handling
// ----------------------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    // Network-level issue?
    if (error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
      backendDownToastOnce();
    }

    const status = error.response?.status;
    const code = (error.response?.data as any)?.error;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Only try to refresh on explicit token expiration
    const shouldTryRefresh = status === 401 && code === 'TOKEN_EXPIRED' && original && !original._retry;

    if (shouldTryRefresh) {
      // If a refresh is already in flight, enqueue this request to retry when done
      if (isRefreshing) {
        return new Promise((resolve) => {
          enqueue((newToken) => {
            if (!original.headers) original.headers = {};
            original.headers.Authorization = `Bearer ${newToken}`;
            original._retry = true;
            resolve(api(original));
          });
        });
      }

      // Start refresh
      isRefreshing = true;
      try {
        const newToken = await performRefresh();
        flushQueue(newToken);

        if (!original.headers) original.headers = {};
        original.headers.Authorization = `Bearer ${newToken}`;
        original._retry = true;
        return api(original);
      } catch (e) {
        // Refresh failed – log out and send to login
        safeClientClear();
        apiLogout(); // your helper may clear user context and route
        redirectToLoginWithQuery('expired');
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // All other 401/403 → treat as unauth
    if (status === 401 || status === 403) {
      safeClientClear();
      apiLogout();
      redirectToLoginWithQuery('unauth');
    }

    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------------
// Convenience auth endpoints (optional)
// ----------------------------------------------------------------------------
export const signup = (email: string, password: string) => api.post('/auth/signup', { email, password });
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout').finally(() => safeClientClear());

// ----------------------------------------------------------------------------
// Optional: a small helper for GET with typed params (ergonomics)
// ----------------------------------------------------------------------------
export async function getJson<T>(url: string, params?: Record<string, any>) {
  const { data } = await api.get<T>(url, { params });
  return data;
}
