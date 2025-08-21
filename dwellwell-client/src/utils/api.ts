// dwellwell-client/src/utils/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { apiLogout } from '@/utils/logoutHelper';

//
// Prefer a full URL in dev: VITE_API_BASE_URL=http://localhost:4000/api
//
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // allow refresh cookie
  timeout: 30000,
});

// ------------------------ Token helpers -------------------------------------

function getStoredToken(): string | null {
  const raw = localStorage.getItem('dwellwell-token');
  if (!raw) return null;

  // If someone accidentally stored JSON-quoted token, unquote safely.
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
  } catch {
    /* not JSON, fall through */
  }
  return raw.replace(/^"+|"+$/g, '').trim();
}

function isLikelyJwt(token?: string | null) {
  return !!token && token.split('.').length === 3;
}

// ------------------------ URL normalizer ------------------------------------
//
// If baseURL already ends with '/api' and the request URL *also* starts with '/api',
// strip the leading '/api' from the request to avoid '/api/api/...'.
function normalizeUrlForBase(config: any) {
  const base = (config.baseURL || '') as string;
  const url = (config.url || '') as string;

  // Skip absolute URLs
  if (/^https?:\/\//i.test(url)) return config;

  const baseEndsWithApi = base.replace(/\/+$/, '').endsWith('/api');
  if (baseEndsWithApi && url.startsWith('/api/')) {
    config.url = url.slice(4); // remove leading "/api"
  }
  return config;
}

// ------------------------ Prevent toast spam --------------------------------
let hasShownBackendError = false;

// ------------------------ Refresh management --------------------------------
let isRefreshing = false;
let refreshSubscribers: Array<(t: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ------------------------ Request interceptor --------------------------------
api.interceptors.request.use(
  (config) => {
    config = normalizeUrlForBase(config);

    const token = getStoredToken();
    if (isLikelyJwt(token) && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (config.headers && 'Authorization' in config.headers) {
      delete (config.headers as any)['Authorization'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------------ Response interceptor -------------------------------
api.interceptors.response.use(
  (response) => {
    hasShownBackendError = false;
    return response;
  },
  async (error) => {
    const originalRequest: any = error.config || {};
    const status = error.response?.status;
    const url: string = originalRequest.url || '';
    const errorCode = error.response?.data?.error;

    // Never try to refresh for login/signup calls
    if (status === 401 && (url.includes('/auth/login') || url.includes('/auth/signup'))) {
      return Promise.resolve(error.response);
    }

    // If backend explicitly marks the token as expired, logout right away.
    if (status === 401 && errorCode === 'TOKEN_EXPIRED') {
      hardLogoutToLogin('expired');
      return;
    }

    // Refresh flow on 401 (once per request)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue until the current refresh is done
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // Note: *no* extra '/api' prefix here; baseURL already has it.
        const res = await api.post('/auth/refresh');
        const newAccessToken = res.data?.accessToken;

        if (!isLikelyJwt(newAccessToken)) {
          throw new Error('No/invalid accessToken in refresh response');
        }

        localStorage.setItem('dwellwell-token', newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed -> full logout + redirect
        safeClientClear();
        notifySessionExpiredOnce();
        redirectToLoginWithQuery('expired');
        return;
      } finally {
        isRefreshing = false;
      }
    }

    // Backend down / network error toast (rate-limited)
    if (
      error.code === 'ERR_NETWORK' ||
      (error.message && error.message.toLowerCase().includes('network error'))
    ) {
      if (!hasShownBackendError) {
        toast({
          title: 'Backend Error',
          description: '🚨 The backend is not running.',
          variant: 'destructive',
        });
        hasShownBackendError = true;
      }
    }

    return Promise.reject(error);
  }
);

// ------------------------ Helpers: logout/redirect ---------------------------

function safeClientClear() {
  try {
    apiLogout?.();
  } catch {}
  try {
    localStorage.removeItem('dwellwell-token');
    localStorage.removeItem('dwellwell-user');
  } catch {}
}

function notifySessionExpiredOnce() {
  if (!window.location.pathname.includes('/login')) {
    toast({
      title: 'Session expired',
      description: 'Please log in again.',
      variant: 'destructive',
    });
  }
}

function redirectToLoginWithQuery(reason: 'expired' | 'unauth' = 'unauth') {
  const qp = reason === 'expired' ? '?expired=1' : '?unauth=1';
  if (window.location.pathname !== '/login') {
    window.location.assign(`/login${qp}`);
  }
}

function hardLogoutToLogin(reason: 'expired' | 'unauth') {
  safeClientClear();
  notifySessionExpiredOnce();
  redirectToLoginWithQuery(reason);
}

// ------------------------ Auth helpers ---------------------------------------

export const signup = (email: string, password: string) =>
  api.post('/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
