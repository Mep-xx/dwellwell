import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Homes from '@/pages/Homes';
import HomeEditPage from "@/pages/HomeEditPage";
import Trackables from '@/pages/Trackables';
import Lawn from '@/pages/Lawn';
import Vehicles from '@/pages/Vehicles';
import AdminUsers from '@/pages/admin/AdminUsers';

// layouts
import Layout from '@/components/layout/Layout';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';
import AdminHomes from '@/pages/admin/AdminHomes';
import AdminTrackables from '@/pages/admin/AdminTrackables';
import Billing from '@/pages/Billing';
import Settings from '@/pages/Settings';

import RequireAuth from './RequireAuth';

/** Blocks authed users from seeing public routes (/, /login, /signup) */
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
      {/* Public routes use the public Layout (no sidebar) */}
      <Route element={<Layout />}>
        <Route element={<RequireGuest />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      {/* Private routes require auth and render the protected layout (with sidebar) */}
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/homes" element={<Homes />} />
          <Route path="/homes/:id/edit" element={<HomeEditPage />} />
          <Route path="/app/trackables" element={<Trackables />} />
          <Route path="/app/lawn" element={<Lawn />} />
          <Route path="/app/vehicles" element={<Vehicles />} />

          {/* Admin */}
          <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/admin/AdminTaskTemplates" element={<AdminTaskTemplates />} />
          <Route path="/admin/AdminUsers" element={<AdminUsers />} />
          <Route path="/admin/AdminHomes" element={<AdminHomes />} />
          <Route path="/admin/AdminTrackables" element={<AdminTrackables />} />

          {/* Account */}
          <Route path="/app/Settings" element={<Settings />} />
          <Route path="/app/Billing" element={<Billing />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
