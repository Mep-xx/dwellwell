//dwellwell-client/src/hooks/useAuth.ts
export function useAuth() {
    const token = localStorage.getItem('authToken');
    return { isAuthenticated: !!token };
  }
  