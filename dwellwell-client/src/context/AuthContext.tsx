// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { api, getToken, setToken } from '@/utils/api';

type User = { id: string; email: string; role: 'user' | 'admin' };
type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
};

const ACCESS_TOKEN_KEY = 'dwellwell-token';
const USER_KEY = 'dwellwell-user';

const AuthContext = createContext<AuthContextType | null>(null);

function hasRefreshHintCookie() {
  // strictly checks the specific cookie name and path prefix
  return document.cookie.split('; ').some((c) => c.startsWith('dw_has_refresh='));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ StrictMode double-invoke guard (dev only)
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const t = getToken();
    const uRaw = localStorage.getItem(USER_KEY);

    if (t && uRaw) {
      try {
        setUser(JSON.parse(uRaw));
        setTokenState(t);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }

    // Try a single silent refresh if cookie is present (if not, this will 401 and we just ignore)
    (async () => {
      try {
        if (!hasRefreshHintCookie()) {
          setLoading(false);
          return; // 👈 no refresh cookie present; avoid 401 noise
        }
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh', {});
        const uRaw = localStorage.getItem(USER_KEY);
        if (data?.accessToken && uRaw) {
          setToken(data.accessToken);
          setTokenState(data.accessToken);
          setUser(JSON.parse(uRaw));
        }
      } catch {
        // not logged in; ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (u: User, t: string) => {
    setUser(u);
    setTokenState(t);
    localStorage.setItem(ACCESS_TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Best-effort server cookie clear
    api.post('/auth/logout').catch(() => { });
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {!loading ? children : <div className="p-8 text-center text-gray-500">Loading…</div>}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};