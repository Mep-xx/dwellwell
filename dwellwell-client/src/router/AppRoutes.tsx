import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Public pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';

// App pages (authed)
import Dashboard from '@/pages/Dashboard';
import Trackables from '@/pages/Trackables';
import Homes from '@/pages/Homes';
import Lawn from '@/pages/Lawn';
import Vehicles from '@/pages/Vehicles';
import Settings from '@/pages/Settings';
import Billing from '@/pages/Billing';

// Admin pages
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminHomes from '@/pages/admin/AdminHomes';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTrackables from '@/pages/admin/AdminTrackables';

// If you use an admin guard, import and wrap routes:
// import { RequireAdmin } from '@/components/RequireAdmin';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public shell */}
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Authed app */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trackables" element={<Trackables />} />
        <Route path="/homes" element={<Homes />} />
        <Route path="/lawn" element={<Lawn />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />

        {/* Admin paths (kept EXACTLY as your sidebar links) */}
        {/* Optional: wrap with RequireAdmin if you have it */}
        {/* <Route element={<RequireAdmin />}> */}
          <Route path="/admin" element={<Navigate to="/admin/AdminDashboard" replace />} />
          <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/admin/AdminTaskTemplates" element={<AdminTaskTemplates />} />
          <Route path="/admin/AdminUsers" element={<AdminUsers />} />
          <Route path="/admin/AdminHomes" element={<AdminHomes />} />
          <Route path="/admin/AdminTrackables" element={<AdminTrackables />} />
          {/* Future:
          <Route path="/admin/AdminFeedback" element={<AdminFeedback />} />
          <Route path="/admin/AdminAIQueries" element={<AdminAIQueries />} />
          <Route path="/admin/AdminDismissed" element={<AdminDismissed />} />
          <Route path="/admin/AdminWhatsNew" element={<AdminWhatsNew />} />
          */}
        {/* </Route> */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
