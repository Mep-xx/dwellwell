import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
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
            <NavLink to="/admin/AdminTaskTemplates" className={({ isActive }) => navLinkClasses(isActive)}>
              🗂 Task Templates
            </NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => navLinkClasses(isActive)}>
              👥 Users
            </NavLink>
            <NavLink to="/admin/homes" className={({ isActive }) => navLinkClasses(isActive)}>
              🏘 Homes
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

      {/* Main content area */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-md p-4 sticky top-0 z-0">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-brand-primary"></h1>
          </div>
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
