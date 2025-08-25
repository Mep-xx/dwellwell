// src/router/RequireAuth.tsx
import { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const hasToken = !!localStorage.getItem('dwellwell-token');

  if (!hasToken) {
    // send them to login; preserve where they came from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Support both wrapper style and <Route element> style
  return children ? <>{children}</> : <Outlet />;
}
