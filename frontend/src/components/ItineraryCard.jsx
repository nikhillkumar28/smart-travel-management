export default function ItineraryCard({ day }) {
  if (!day) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
          Day {day.day}
        </span>
        <span className="text-sm font-semibold text-white">{day.title}</span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Morning
          </p>
          <p className="mt-1 text-slate-100">{day.activities?.morning || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Afternoon
          </p>
          <p className="mt-1 text-slate-100">{day.activities?.afternoon || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Evening
          </p>
          <p className="mt-1 text-slate-100">{day.activities?.evening || '—'}</p>
        </div>
      </div>
    </article>
  );
}
