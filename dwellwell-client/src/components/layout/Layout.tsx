//dwellwell-client/src/components/layout/Layout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();

  // which public page?
  const onLogin = pathname.startsWith('/login');
  const onSignup = pathname.startsWith('/signup');

  // session banner (?reason=expired|unauth or legacy ?expired / ?unauth)
  const [banner, setBanner] = useState<string | null>(null);
  const reason = useMemo(() => {
    const p = new URLSearchParams(search);
    return p.get('reason') || (p.has('expired') ? 'expired' : p.has('unauth') ? 'unauth' : null);
  }, [search]);

  useEffect(() => {
    if (reason === 'expired') setBanner('Your session expired. Please sign in again.');
    else if (reason === 'unauth') setBanner('Please sign in to continue.');
    else setBanner(null);
  }, [reason]);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-body">
      {/* Public header (no sidebar here) */}
      <header className="px-6 py-4 flex items-center justify-between shadow bg-card border-b border-token">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="DwellWell Logo" className="h-10" />
          <span className="sr-only">DwellWell</span>
        </Link>

        {/* Only show auth buttons when not logged in */}
        {!loading && !user && (
          <div className="flex items-center gap-3">
            {!onLogin && (
              <Link
                to="/login"
                className="text-sm px-4 py-2 rounded border border-token bg-card text-body hover:bg-primary-soft hover:text-primary transition"
              >
                Log In
              </Link>
            )}
            {!onSignup && (
              <Link
                to="/signup"
                className="text-sm bg-primary text-on-primary px-4 py-2 rounded hover:opacity-90 transition"
              >
                Get Started
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Optional banner for public routes */}
      {!loading && !user && banner && (
        <div className="mx-6 mt-3 rounded bg-primary-soft border border-primary/40 text-body px-3 py-2 text-sm">
          {banner}
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Single footer */}
      <footer className="text-center text-sm text-muted py-6 border-t border-token px-4 bg-card">
        © {new Date().getFullYear()} DwellWell. All rights reserved.
      </footer>
    </div>
  );
}
