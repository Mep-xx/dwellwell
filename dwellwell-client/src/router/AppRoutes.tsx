// src/router/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

import Layout from '../components/layout/Layout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Trackables from '../pages/Trackables';
import Homes from '../pages/Homes';
import Lawn from '../pages/Lawn';
import Vehicles from '@/pages/Vehicles';
import Settings from '../pages/Settings';
import Billing from '../pages/Billing';
import NotFound from '../pages/NotFound';

// Admin
import { RequireAdmin } from '@/components/RequireAdmin';
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Everything under the same app Layout (shared sidebar) */}
      <Route element={<Layout />}>
        {/* Auth-required user routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trackables"
          element={
            <ProtectedRoute>
              <Trackables />
            </ProtectedRoute>
          }
        />
        <Route
          path="/homes"
          element={
            <ProtectedRoute>
              <Homes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawn"
          element={
            <ProtectedRoute>
              <Lawn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <Vehicles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />

        {/* Admin routes (same layout/sidebar) */}
        <Route
          path="/admin/admintasktemplates"
          element={
            <ProtectedRoute>
              <RequireAdmin>
                <AdminTaskTemplates />
              </RequireAdmin>
            </ProtectedRoute>
          }
        />
        {/* Alias for the capitalized path some links may use */}
        <Route
          path="/admin/AdminTaskTemplates"
          element={
            <ProtectedRoute>
              <RequireAdmin>
                <AdminTaskTemplates />
              </RequireAdmin>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RequireAdmin>
                <div>User Management Placeholder</div>
              </RequireAdmin>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/homes"
          element={
            <ProtectedRoute>
              <RequireAdmin>
                <div>Homes Management Placeholder</div>
              </RequireAdmin>
            </ProtectedRoute>
          }
        />
        {/* Optional: /admin -> task templates */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/admintasktemplates" replace />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
