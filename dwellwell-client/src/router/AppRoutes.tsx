// dwellwell-client/src/router/AppRoutes.tsx
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Homes from '@/pages/Homes';
import Home from '@/pages/Home';
import Trackables from '@/pages/Trackables';
import Vehicles from '@/pages/Vehicles';
import Settings from '@/pages/Settings';
import Billing from '@/pages/Billing';
import Room from '@/pages/Room';

// NEW
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';

// layouts
import Layout from '@/components/layout/Layout';
import ProtectedLayout from '@/components/layout/ProtectedLayout';

// admin (unchanged)
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';
import AdminHomes from '@/pages/admin/AdminHomes';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminTrackables from '@/pages/admin/AdminTrackables';

function RequireGuest() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (user) return <Navigate to="/app" replace state={{ from: loc }} />;
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<Layout />}>
        <Route element={<RequireGuest />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      {/* Private */}
      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/homes" element={<Homes />} />
        <Route path="/app/homes/:id" element={<Home />} />
        <Route path="/app/rooms/:roomId" element={<Room />} />
        <Route path="/app/trackables" element={<Trackables />} />
        <Route path="/app/vehicles" element={<Vehicles />} />

        {/* NEW */}
        <Route path="/app/tasks" element={<TasksPage />} />
        <Route path="/app/tasks/:taskId" element={<TaskDetailPage />} />

        {/* Account */}
        <Route path="/app/settings" element={<Settings />} />
        <Route path="/app/billing" element={<Billing />} />

        {/* Admin */}
        <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/admin/AdminTaskTemplates" element={<AdminTaskTemplates />} />
        <Route path="/admin/AdminUsers" element={<AdminUsers />} />
        <Route path="/admin/AdminHomes" element={<AdminHomes />} />
        <Route path="/admin/AdminTrackables" element={<AdminTrackables />} />

        {/* Legacy redirects */}
        <Route path="/app/homes/:id/edit" element={<Navigate to="/app/homes/:id" replace />} />
        <Route path="/homes/:id/edit" element={<Navigate to="/app/homes/:id" replace />} />
        <Route path="/homes" element={<Navigate to="/app/homes" replace />} />
        <Route path="/app/room/:id" element={<Navigate to="/app/rooms/:id" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
