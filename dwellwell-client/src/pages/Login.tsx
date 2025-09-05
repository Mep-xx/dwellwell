// dwellwell-client/src/pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

type LoginResponse = {
  accessToken?: string;
  token?: string; // in case the API returns { token }
  user?: { id: string; email: string; role: 'user' | 'admin' };
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });

      const accessToken = data?.accessToken;
      const user = data?.user;

      if (!data || !accessToken || !user?.id) {
        setError('Unexpected response. Please try again.');
        return;
      }

      login(user, accessToken);
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

  const handleGoogleSuccess = async (resp: CredentialResponse) => {
    setError('');
    setGoogleSubmitting(true);
    try {
      const credential = resp.credential;
      if (!credential) throw new Error('No Google credential returned');

      // NOTE: Your auth router mounts at /auth, and you added /authGoogle there.
      const { data } = await api.post<LoginResponse>('/auth/authGoogle', { credential });

      const accessToken = data?.accessToken ?? data?.token;
      const user = data?.user;

      if (!accessToken) {
        throw new Error('Unexpected response (no token).');
      }
      if (!user?.id) {
        // If your endpoint doesn't return user, you could navigate and let
        // your app bootstrap fetch populate context. But your AuthContext.login
        // expects a user, so prefer returning user from the API.
        throw new Error('Unexpected response (no user).');
      }

      login(user, accessToken);
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Google login failed. Please try again.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Helmet>
        <title>Log in • DwellWell</title>
      </Helmet>

      <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-semibold text-gray-900">Welcome back</h1>

        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        ) : null}

        {/* Google Sign-in */}
        <div className="flex flex-col items-center">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              // useOneTap // optional
            />
          </div>
          {googleSubmitting && (
            <p className="mt-2 text-sm text-gray-500">Signing in with Google…</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-500">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Email/Password form */}
        <form onSubmit={handleLogin} className="space-y-4">
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
            disabled={submitting || googleSubmitting}
            className="w-full rounded-xl bg-brand-primary text-white py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-brand-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
