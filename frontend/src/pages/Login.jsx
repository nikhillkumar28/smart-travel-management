import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email.trim() || !password) return setError('Email and password are required.');
    if (!emailPattern.test(email.trim())) return setError('Enter a valid email address.');
    try {
      setIsSubmitting(true);
      setError('');
      await login({ email: email.trim(), password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to log in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 shadow-lg backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold">Log in</h1>
        <p className="mt-2 text-sm text-slate-300">Continue planning your next trip.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <label className="block space-y-2 text-sm font-semibold text-slate-200">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-normal text-white outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30" /></label>
          <label className="block space-y-2 text-sm font-semibold text-slate-200">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-normal text-white outline-none focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30" /></label>
          {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70">{isSubmitting ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-300">New here? <Link to="/register" className="font-semibold text-amber-200 hover:text-amber-100">Create an account</Link></p>
      </div>
    </section>
  );
}
