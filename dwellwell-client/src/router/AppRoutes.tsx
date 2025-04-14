import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
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

function isLoggedIn() {
  return !!localStorage.getItem('dwellwell-user');
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={isLoggedIn() ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<Layout />}>
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
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
