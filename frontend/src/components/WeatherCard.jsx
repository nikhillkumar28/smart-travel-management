export default function WeatherCard({ status, weather, error, destination }) {
  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur">
        <p className="text-sm text-slate-300">Fetching weather...</p>
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

  if (status !== 'success' || !weather) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        Weather
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-300">{weather.locationLabel || destination}</p>
          <p className="text-3xl font-semibold text-white">
            {weather.temperature !== null ? `${weather.temperature}°C` : '--'}
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-100">{weather.condition}</div>
      </div>
    </div>
  );
}
