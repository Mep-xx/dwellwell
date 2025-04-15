import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Dashboard from '../pages/Dashboard';
import Trackables from '../pages/Trackables';
import Homes from '../pages/Homes';
import Lawn from '../pages/Lawn';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import Billing from '../pages/Billing';

import ProtectedLayout from '@/components/layout/ProtectedLayout';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trackables" element={<Trackables />} />
        <Route path="/homes" element={<Homes />} />
        <Route path="/lawn" element={<Lawn />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}