import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const linkClass =
    'rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/70 hover:text-amber-200';
  return (
    <nav className="w-full border-b border-white/10 bg-slate-950/80 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-wide">Journo..</span>
        <div className="flex items-center gap-3">
          <Link to="/" className={linkClass}>Home</Link>
          <Link to="/destinations" className={linkClass}>Destinations</Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-trips" className={linkClass}>My Trips</Link>
              <button type="button" onClick={logout} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Login</Link>
              <Link to="/register" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
