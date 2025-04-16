import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(); // this clears localStorage + state
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-brand-background text-brand-foreground">
      {/* Sidebar - static height, scrolls independently if needed */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between fixed top-0 left-0 bottom-0 z-10">
        <div>
          {/* Logo */}
          <div className="flex items-center justify-left p-4 border-b">
            <img src="/logo.png" alt="DwellWell Logo" className="h-10" />
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block py-2 transition-colors rounded-r-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                    : 'text-gray-700 hover:text-blue-600 pl-4'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/trackables"
              className={({ isActive }) =>
                `block py-2 transition-colors rounded-r-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                    : 'text-gray-700 hover:text-blue-600 pl-4'
                }`
              }
            >
              🔧 Trackables
            </NavLink>
            <NavLink
              to="/homes"
              className={({ isActive }) =>
                `block py-2 transition-colors rounded-r-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                    : 'text-gray-700 hover:text-blue-600 pl-4'
                }`
              }
            >
              🏠 Homes
            </NavLink>
            <NavLink
              to="/lawn"
              className={({ isActive }) =>
                `block py-2 transition-colors rounded-r-md ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                    : 'text-gray-700 hover:text-blue-600 pl-4'
                }`
              }
            >
              🌿 Lawn
            </NavLink>
          </nav>
        </div>

        {/* Bottom section: Settings / Billing / Logout */}
        <div className="p-4 border-t space-y-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `block py-2 transition-colors rounded-r-md ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                  : 'text-gray-700 hover:text-blue-600 pl-4'
              }`
            }
          >
            ⚙️ Settings
          </NavLink>
          <NavLink
            to="/billing"
            className={({ isActive }) =>
              `block py-2 transition-colors rounded-r-md ${
                isActive
                  ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600 pl-4'
                  : 'text-gray-700 hover:text-blue-600 pl-4'
              }`
            }
          >
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

      {/* Content area shifted to the right to make room for sidebar */}
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
