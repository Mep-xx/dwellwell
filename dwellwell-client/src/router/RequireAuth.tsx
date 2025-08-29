//dwellwell-client/src/router/RequireAuth.tsx
import { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}