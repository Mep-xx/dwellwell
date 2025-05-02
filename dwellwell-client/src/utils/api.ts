// src/utils/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast'; // this now references the non-hook version

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // keep this if backend allows credentials
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dwellwell-token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Show a toast only once per session if backend is down
let hasShownBackendError = false;

api.interceptors.response.use(
  (response) => {
    hasShownBackendError = false;
    return response;
  },
  (error) => {
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

export const signup = (email: string, password: string) =>
  api.post('/api/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });
