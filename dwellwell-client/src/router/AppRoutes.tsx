// dwellwell-client/src/router/AppRoutes.tsx
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// layouts
import Layout from '@/components/layout/Layout';
import ProtectedLayout from '@/components/layout/ProtectedLayout';

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
import Profile from '@/pages/Profile';

// Redesign
import HomesRedesign from '@/pages/HomesRedesign';

// NEW
import Tasks from '@/pages/Tasks';
import TaskRunnerPage from '@/pages/TaskRunner';

// community
import CommunityHome from '@/pages/community/CommunityHome';
import CommunityCategory from '@/pages/community/CommunityCategory';
import CommunityThread from '@/pages/community/CommunityThread';
import CommunityUser from '@/pages/community/CommunityUser';

// admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';
import AdminHomes from '@/pages/admin/AdminHomes';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminTrackables from '@/pages/admin/AdminTrackables';
import AdminTaskGenIssues from '@/pages/admin/AdminTaskGenIssues';
import AdminApplianceCatalog from '@/pages/admin/AdminApplianceCatalog';

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

      {/* Public redirect for old links */}
      <Route path="/v2/homes" element={<Navigate to="/app/v2/homes" replace />} />

      {/* Private */}
      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<Dashboard />} />

        {/* Classic */}
        <Route path="/app/homes" element={<Homes />} />
        <Route path="/app/homes/:id" element={<Home />} />
        <Route path="/app/rooms/:roomId" element={<Room />} />
        <Route path="/app/trackables" element={<Trackables />} />
        <Route path="/app/vehicles" element={<Vehicles />} />

        {/* Redesign */}
        <Route path="/app/v2/homes" element={<HomesRedesign />} />

        {/* Tasks */}
        <Route path="/app/tasks" element={<Tasks />} />
        <Route path="/app/tasks/:taskId" element={<TaskRunnerPage />} />

        {/* Account */}
        <Route path="/app/profile" element={<Profile />} />
        <Route path="/app/settings" element={<Settings />} />
        <Route path="/app/billing" element={<Billing />} />

        {/* Admin */}
        <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/admin/AdminTaskTemplates" element={<AdminTaskTemplates />} />
        <Route path="/admin/AdminUsers" element={<AdminUsers />} />
        <Route path="/admin/AdminHomes" element={<AdminHomes />} />
        <Route path="/admin/AdminTrackables" element={<AdminTrackables />} />
        <Route path="/admin/AdminTaskGenIssues" element={<AdminTaskGenIssues />} />
        <Route path="/admin/AdminApplianceCatalog" element={<AdminApplianceCatalog />} />

        {/* Community */}
        <Route path="/community" element={<CommunityHome />} />
        <Route path="/community/:categorySlug" element={<CommunityCategory />} />
        <Route path="/community/thread/:threadId" element={<CommunityThread />} />
        <Route path="/community/user/:userId" element={<CommunityUser />} />

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
