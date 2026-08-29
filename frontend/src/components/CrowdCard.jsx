function getCrowdBadge(crowdLevel) {
  if (crowdLevel === 'High') return 'bg-red-500/10 text-red-300 border-red-500/30';
  if (crowdLevel === 'Medium') return 'bg-amber-500/10 text-amber-200 border-amber-500/30';
  return 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30';
}

export default function CrowdCard({ status, crowd, error, destination }) {
  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur">
        <p className="text-sm text-slate-300">Estimating crowd level...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
        {error}
      </div>
    );
  }

  if (status !== 'success' || !crowd) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        Crowd prediction
      </p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">{crowd.location || destination}</p>
          <p className="text-2xl font-semibold text-white">{crowd.crowdLevel}</p>
        </div>
        <span
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${getCrowdBadge(
            crowd.crowdLevel
          )}`}
        >
          {crowd.crowdLevel}
        </span>
      </div>
    </div>
  );
}
