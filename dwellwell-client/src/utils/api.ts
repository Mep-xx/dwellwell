// dwellwell-client/src/utils/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { apiLogout } from '@/utils/logoutHelper';

// Prefer a full URL in dev: VITE_API_BASE_URL=http://localhost:4000/api
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // send refresh cookie
});

// --- Token helpers -----------------------------------------------------------
function getStoredToken(): string | null {
  const raw = localStorage.getItem('dwellwell-token');
  if (!raw) return null;

  // If someone accidentally stored JSON-quoted token, unquote it safely.
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

// --- Request interceptor: attach Authorization -------------------------------
api.interceptors.request.use(
  (config) => {
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

// --- Prevent toast spam ------------------------------------------------------
let hasShownBackendError = false;

// --- Refresh management ------------------------------------------------------
let isRefreshing = false;
let refreshSubscribers: Array<(t: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}
function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// --- Response interceptor: handle 401 -> refresh -----------------------------
api.interceptors.response.use(
  (response) => {
    hasShownBackendError = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only handle 401 once per request
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Queue requests while a refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newAccessToken = res.data?.accessToken;

        if (!isLikelyJwt(newAccessToken)) {
          throw new Error('No/invalid accessToken in refresh response');
        }

        localStorage.setItem('dwellwell-token', newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Hard logout on refresh failure
        apiLogout?.();
        localStorage.removeItem('dwellwell-token');
        localStorage.removeItem('dwellwell-user');

        toast({
          title: 'Session expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });

        window.location.href = '/login';
        return;
      } finally {
        isRefreshing = false;
      }
    }

    // Backend down / network error
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

// --- Auth functions: DO NOT double-prefix with /api --------------------------
export const signup = (email: string, password: string) =>
  api.post('/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password });
