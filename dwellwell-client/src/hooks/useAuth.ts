export function useAuth() {
    const token = localStorage.getItem('authToken');
    return { isAuthenticated: !!token };
  }
  