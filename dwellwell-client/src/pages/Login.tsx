//dwellwell-client/src/pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; role: 'user' | 'admin' };
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });

      if (!data || !data.accessToken || !data.user?.id) {
        setError('Unexpected response. Please try again.');
        return;
      }

      login(data.user, data.accessToken);
      navigate('/app', { replace: true });
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error;

      if (status === 401 && code === 'INVALID_CREDENTIALS') {
        setError('Incorrect email or password.');
      } else if (status === 429) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else if (status === 400) {
        setError('Please enter a valid email and password.');
      } else {
        setError('Unexpected response. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Helmet>
        <title>Log in • DwellWell</title>
      </Helmet>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-primary text-white py-2.5 font-medium disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log In'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-brand-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
