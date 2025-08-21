// dwellwell-client/src/components/layout/Layout.tsx
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  // We treat auth as valid only if we have a user AND a client-side token hint (if you use one).
  // This helps hide the sidebar immediately after a forced logout redirect.
  const hasLocalToken = useMemo(() => {
    try {
      return !!localStorage.getItem('dwellwell-token');
    } catch {
      return false;
    }
  }, []);

  const isAuthed = !!user && hasLocalToken;

  const [banner, setBanner] = useState<string | null>(null);

  // Show a friendly message if redirected here due to expired/unauthorized session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('expired')) {
      setBanner('Your session expired. Please sign in again.');
    } else if (params.has('unauth')) {
      setBanner('Please sign in to continue.');
    } else {
      // Also check if api.ts left a message
      const msg = sessionStorage.getItem('authMessage');
      if (msg === 'expired') setBanner('Your session expired. Please sign in again.');
      if (msg === 'unauthorized') setBanner('Please sign in to continue.');
      sessionStorage.removeItem('authMessage');
    }
  }, [location.search]);

  const handleLogout = () => {
    // Full logout
    try {
      localStorage.removeItem('dwellwell-token');
    } catch {}
    logout();
    navigate('/login');
  };

  const navLinkClasses = (isActive: boolean) =>
    `block py-2 transition-colors rounded-r-md ${
      isActive
        ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
        : 'text-gray-700 hover:text-blue-600 pl-4'
    }`;

  return (
    <div className="min-h-screen flex bg-brand-background text-brand-foreground">
      {/* Sidebar: only for authenticated users */}
      {isAuthed && (
        <aside className="w-64 bg-white border-r shadow-sm flex flex-col fixed top-0 left-0 bottom-0 z-10">
          {/* Top: Logo + Main Nav */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-left p-4 border-b">
              <img src="/logo.png" alt="DwellWell Logo" className="h-10" />
            </div>

            <nav className="p-4 space-y-2">
              <NavLink to="/dashboard" className={({ isActive }) => navLinkClasses(isActive)}>
                Dashboard
              </NavLink>
              <NavLink to="/homes" className={({ isActive }) => navLinkClasses(isActive)}>
                🏠 Homes
              </NavLink>
              <NavLink to="/trackables" className={({ isActive }) => navLinkClasses(isActive)}>
                🔧 Trackables
              </NavLink>
              <NavLink to="/lawn" className={({ isActive }) => navLinkClasses(isActive)}>
                🌿 Lawn
              </NavLink>
              <NavLink to="/vehicles" className={({ isActive }) => navLinkClasses(isActive)}>
                🚗 Vehicles
              </NavLink>
            </nav>
          </div>

          {/* Admin Links */}
          {user?.role === 'admin' && (
            <div className="px-4 space-y-2 border-t pt-4">
              <p className="text-xs uppercase text-gray-400">Admin</p>

              <NavLink to="/admin/AdminDashboard" className={({ isActive }) => navLinkClasses(isActive)}>
                📊 Admin Dashboard
              </NavLink>
              <NavLink to="/admin/AdminTaskTemplates" className={({ isActive }) => navLinkClasses(isActive)}>
                🗂 Task Templates
              </NavLink>
              <NavLink to="/admin/AdminUsers" className={({ isActive }) => navLinkClasses(isActive)}>
                👥 Users
              </NavLink>
              <NavLink to="/admin/AdminHomes" className={({ isActive }) => navLinkClasses(isActive)}>
                🏘 Homes
              </NavLink>
              <NavLink to="/admin/AdminTrackables" className={({ isActive }) => navLinkClasses(isActive)}>
                📚 Trackables (Resources)
              </NavLink>
            </div>
          )}

          {/* Bottom: Settings + Logout */}
          <div className="p-4 border-t space-y-2">
            <NavLink to="/settings" className={({ isActive }) => navLinkClasses(isActive)}>
              ⚙️ Settings
            </NavLink>
            <NavLink to="/billing" className={({ isActive }) => navLinkClasses(isActive)}>
              💳 Billing
            </NavLink>
            <button
              onClick={handleLogout}
              className="block w-full text-left text-red-600 hover:text-red-700 py-2 pl-4 text-sm"
            >
              🚪 Log Out
            </button>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <main className={`${isAuthed ? 'ml-64' : 'ml-0'} flex-1 flex flex-col min-h-screen`}>
        <header className="bg-white shadow-md p-4 sticky top-0 z-0">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-brand-primary"></h1>
          </div>
          {/* Session banner (only on public shell or when set) */}
          {!isAuthed && banner && (
            <div className="mt-3 mx-4 rounded bg-yellow-50 border border-yellow-200 text-yellow-900 px-3 py-2 text-sm">
              {banner}
            </div>
          )}
        </header>

        <section className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </section>

        <footer className="bg-white shadow-inner p-4 text-sm text-center text-gray-500">
          © {new Date().getFullYear()} DwellWell. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
