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

//Admin Logic
import { RequireAdmin } from '@/components/RequireAdmin';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminTaskTemplates from '@/pages/admin/AdminTaskTemplates';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; // or <Spinner />

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/trackables" element={<ProtectedRoute><Trackables /></ProtectedRoute>} />
        <Route path="/homes" element={<ProtectedRoute><Homes /></ProtectedRoute>} />
        <Route path="/lawn" element={<ProtectedRoute><Lawn /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="admintasktemplates" element={<AdminTaskTemplates />} />
        <Route path="users" element={<div>User Management Placeholder</div>} />
        <Route path="homes" element={<div>Homes Management Placeholder</div>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
