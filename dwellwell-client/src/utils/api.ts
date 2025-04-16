// src/utils/api.ts
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL, 
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

export const signup = (email: string, password: string) =>
  api.post('/api/auth/signup', { email, password });

export const login = (email: string, password: string) =>
  api.post('/api/auth/login', { email, password });
