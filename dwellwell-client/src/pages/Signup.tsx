// src/pages/Signup.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '@/utils/api'; // use the same api instance as Login
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/auth/signup', { email, password });
      const data = res.data;

      if (!data.ok) {
        // backend will never throw 401/500 here — it responds with ok:false
        setError(data.message || 'Signup failed. Please try again.');
        return;
      }

      const { accessToken, user } = data;
      localStorage.setItem('dwellwell-token', accessToken);
      localStorage.setItem('dwellwell-user', JSON.stringify(user));

      login(user, accessToken);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Signup failed:', err);
      setError('Signup failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4">
      <Helmet>
        <title>Sign Up – DwellWell</title>
      </Helmet>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-brand-primary">
          Create your DwellWell account
        </h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-2 border rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-brand-primary text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Sign Up
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
