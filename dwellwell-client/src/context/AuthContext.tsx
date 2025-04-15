// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api'

type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('dwellwell-user');
    const storedToken = localStorage.getItem('dwellwell-token');
  
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
  
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (err) {
        console.warn('Failed to parse stored user:', err);
        localStorage.removeItem('dwellwell-user');
        localStorage.removeItem('dwellwell-token');
      }
    }
  
    setLoading(false);
  }, []);
  

  const login = (user: User, token: string) => {
    localStorage.setItem('dwellwell-user', JSON.stringify(user));
    localStorage.setItem('dwellwell-token', token);
    setUser(user);
    setToken(token);
  
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };
  

  const logout = () => {
    localStorage.removeItem('dwellwell-user');
    localStorage.removeItem('dwellwell-token');
    setUser(null);
    setToken(null);

    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
