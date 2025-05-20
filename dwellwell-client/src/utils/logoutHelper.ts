// src/utils/logoutHelper.ts
export function apiLogout() {
  localStorage.removeItem('dwellwell-token');
  localStorage.removeItem('dwellwell-user');
  window.location.href = '/login';
}