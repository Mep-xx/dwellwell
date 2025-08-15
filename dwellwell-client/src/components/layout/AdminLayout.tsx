// src/components/layout/AdminLayout.tsx
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const navItems = [
    { path: '/admin/admintasktemplates', label: 'Task Templates' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/homes', label: 'Homes' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-gray-100 border-r p-4 space-y-4">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <nav className="space-y-2">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`block px-3 py-2 rounded hover:bg-gray-200 ${
                location.pathname.startsWith(path) ? 'bg-gray-300 font-semibold' : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
