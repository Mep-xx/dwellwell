// src/utils/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000', // adjust if needed
  headers: {
    'x-user-id': '7534594a-dc3c-4e02-a017-06e9443a6035', // You can switch this to a real value later
  },
});

export default api;