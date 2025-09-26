// dwellwell-client/src/components/layout/ProtectedLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // prevent flash after logout
  const hasLocalToken = useMemo(() => {
    try { return !!localStorage.getItem('dwellwell-token'); } catch { return false; }
  }, []);
  const isAuthed = !!user && hasLocalToken;

  const navLinkClasses = (isActive: boolean) =>
    `block py-2 transition-colors rounded-r-md ${isActive
      ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
      : 'text-gray-700 hover:text-blue-600 pl-4'
    }`;

  const handleLogout = () => {
    try { localStorage.removeItem('dwellwell-token'); } catch { }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-brand-background text-brand-foreground">
      {/* Sidebar */}
      {isAuthed && (
        <aside className="w-64 bg-white border-r shadow-sm flex flex-col fixed top-0 left-0 bottom-0 z-10">
          {/* Logo */}
          <div className="flex items-center justify-left p-4 border-b">
            <img src="/logo.png" alt="DwellWell Logo" className="h-10" />
          </div>

          {/* Main nav (use /app/* paths) */}
          <nav className="p-4 space-y-2 flex-1">
            <NavLink to="/app" end className={({ isActive }) => navLinkClasses(isActive)}>
              🏠 Dashboard
            </NavLink>

            <NavLink to="/app/v2/homes" className={({ isActive }) => navLinkClasses(isActive)}>
              🏡 Homes
            </NavLink>
            <NavLink to="/app/trackables" className={({ isActive }) => navLinkClasses(isActive)}>
              🔧 Trackables
            </NavLink>
            <NavLink to="/app/vehicles" className={({ isActive }) => navLinkClasses(isActive)}>
              🚗 Vehicles
            </NavLink>

            {/* Admin section */}
            {user?.role === 'admin' && (
              <div className="mt-4 pt-4 border-t space-y-2">
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
                  📚 Trackables
                </NavLink>
                <NavLink to="/admin/AdminTaskGenIssues" className={({ isActive }) => navLinkClasses(isActive)}>
                  ⚠️ Task Gen Issues
                </NavLink>
              </div>
            )}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t space-y-2">
            <NavLink to="/community" className={({ isActive }) => navLinkClasses(isActive)}>
              💬 Community
            </NavLink>
            <NavLink to="/app/profile" className={({ isActive }) => navLinkClasses(isActive)}>
              👤 Profile
            </NavLink>
            <NavLink to="/app/settings" className={({ isActive }) => navLinkClasses(isActive)}>
              ⚙️ Settings
            </NavLink>
            <NavLink to="/app/billing" className={({ isActive }) => navLinkClasses(isActive)}>
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

      {/* Main content */}
      <main className={`${isAuthed ? 'ml-64' : 'ml-0'} flex-1 flex flex-col min-h-screen`}>
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
