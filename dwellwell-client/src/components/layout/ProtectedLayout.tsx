// src/components/layout/ProtectedLayout.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from './Layout';

export default function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}
