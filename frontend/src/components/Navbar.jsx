import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-white/10 bg-slate-950/80 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-wide">AI Travel</span>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/70 hover:text-amber-200"
          >
            Home
          </Link>
          <Link
            to="/destinations"
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-200"
          >
            Plan Trip
          </Link>
        </div>
      </div>
    </nav>
  );
}
