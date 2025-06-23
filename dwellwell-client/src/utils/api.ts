// src/utils/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { apiLogout } from '@/utils/logoutHelper';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // important for refresh token cookies
});

// Add access token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dwellwell-token');
    console.log(token);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent toast spam
let hasShownBackendError = false;

// Token refresh management
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Handle 401 errors and retry with refreshed token
api.interceptors.response.use(
  (response) => {
    hasShownBackendError = false;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const message = error.response?.data?.message || '';

    // Handle expired access token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

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
        const res = await api.post('/api/auth/refresh-token'); // uses cookie
        const newAccessToken = res.data.accessToken;

        localStorage.setItem('dwellwell-token', newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        apiLogout(); // your helper function
        localStorage.removeItem('dwellwell-token');
        localStorage.removeItem('dwellwell-user');

        toast({
          title: 'Session expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });

        window.location.href = '/login'; // hard redirect to clear context
        return;
      } finally {
        isRefreshing = false;
      }
    }

    // Backend down
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

// Auth functions
export const signup = (email: string, password: string) =>
  api.post('/api/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });
