import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/utils/api';
import { useAuth } from '../context/AuthContext';

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
      const res = await api.post('/auth/login', { email, password });
      // Backend shape: { data: { user, accessToken } }
      const payload = res.data?.data;
      const accessToken: string | undefined = payload?.accessToken;
      const user: any = payload?.user;

      if (!accessToken || !user) {
        setError('Unexpected response. Please try again.');
        return;
      }

      // Persist and update context
      localStorage.setItem('dwellwell-token', accessToken);
      localStorage.setItem('dwellwell-user', JSON.stringify(user));
      login(user, accessToken);

      navigate('/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.error;

      if (status === 401 || code === 'INVALID_CREDENTIALS') {
        setError('Invalid email or password.');
      } else if (status === 400 || code === 'EMAIL_PASSWORD_REQUIRED') {
        setError('Please provide both email and password.');
      } else {
        setError('Could not sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
      <Helmet>
        <title>Login – DwellWell</title>
      </Helmet>

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-brand-primary">Log In to DwellWell</h2>

        {error && (
          <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm text-center">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-primary text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-60"
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
