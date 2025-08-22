// dwellwell-client/src/pages/Signup.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

type SignupResp = {
  accessToken: string;
  user: { id: string; email: string; role: 'user' | 'admin' };
};

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;            // block double-submits
    setErr('');
    setBusy(true);
    try {
      const { data } = await api.post<SignupResp>('/auth/signup', { email, password });
      if (!data?.accessToken || !data?.user?.id) {
        setErr('Unexpected response. Please try again.');
        return;
      }
      // persist + route
      login(data.user, data.accessToken);
      navigate('/app', { replace: true });
    } catch (error: any) {
      const status = error?.response?.status;
      const code = error?.response?.data?.error;
      if (status === 409 || code === 'EMAIL_IN_USE') {
        setErr('That email is already registered. Try logging in.');
      } else if (status === 400) {
        setErr('Please enter a valid email and password.');
      } else {
        setErr('Signup failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Helmet><title>Sign up • DwellWell</title></Helmet>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl shadow">
        <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>

        {err && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{err}</div>}

        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input type="email" className="mt-1 w-full rounded-lg border px-3 py-2" value={email}
                 onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2" value={password}
                 onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
        </label>

        <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-primary text-white py-2.5 font-medium disabled:opacity-60">
          {busy ? 'Creating…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-brand-primary hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
