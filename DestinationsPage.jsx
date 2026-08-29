import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const DESTINATIONS = [
  {
    id: 1,
    name: 'Kyoto, Japan',
    description: 'Temple-lined streets, serene gardens, and timeless tea houses.',
    image:
      'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    name: 'Reykjavik, Iceland',
    description: 'Geothermal lagoons, northern lights, and dramatic volcanic coasts.',
    image:
      'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    name: 'Lisbon, Portugal',
    description: 'Sunlit hills, tiled facades, and soulful riverside vibes.',
    image:
      'https://images.unsplash.com/photo-1503152394-6aa8f0f69c40?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 4,
    name: 'Banff, Canada',
    description: 'Turquoise lakes, alpine trails, and postcard-perfect peaks.',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 5,
    name: 'Marrakesh, Morocco',
    description: 'Spice markets, riads, and vibrant desert sunsets.',
    image:
      'https://images.unsplash.com/photo-1489493887464-892be6d1daae?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 6,
    name: 'Queenstown, New Zealand',
    description: 'Adventure capital with lakeside views and mountain air.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80'
  }
];

function buildMapUrl(lat, lon) {
  const delta = 0.35;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  const bbox = [left, bottom, right, top].join(',');
  return (
    'https://www.openstreetmap.org/export/embed.html?' +
    new URLSearchParams({
      bbox,
      layer: 'mapnik',
      marker: `${lat},${lon}`
    })
  );
}

export default function DestinationsPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(DESTINATIONS[0]?.id ?? null);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [weatherError, setWeatherError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [theme, setTheme] = useState('dark');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DESTINATIONS;
    return DESTINATIONS.filter((destination) => {
      return (
        destination.name.toLowerCase().includes(normalized) ||
        destination.description.toLowerCase().includes(normalized)
      );
    });
  }, [query]);

  const selected = useMemo(() => {
    return DESTINATIONS.find((item) => item.id === selectedId) || DESTINATIONS[0];
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;

    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setWeatherStatus('loading');
        setWeatherError('');

        const response = await fetch(
          `/api/weather?${new URLSearchParams({ destination: selected.name })}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to fetch weather');
        }

        const data = await response.json();
        setWeatherData({
          temperature: data.temperature,
          condition: data.condition,
          description: data.description,
          coordinates: data.coordinates || null,
          locationLabel: data.locationLabel || selected.name
        });
        setWeatherStatus('success');
      } catch (err) {
        if (err.name === 'AbortError') return;
        setWeatherStatus('error');
        setWeatherError(err.message || 'Unable to fetch weather.');
        setWeatherData(null);
      }
    }

    fetchWeather();

    return () => controller.abort();
  }, [selected]);

  const isDark = theme === 'dark';
  const pageBg = isDark
    ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white'
    : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900';
  const surface = isDark
    ? 'border-white/10 bg-white/5'
    : 'border-slate-200 bg-white';
  const surfaceSoft = isDark
    ? 'border-white/10 bg-white/5'
    : 'border-slate-200 bg-slate-50';
  const mutedText = isDark ? 'text-slate-300' : 'text-slate-600';
  const inputBg = isDark ? 'bg-white/5 text-white' : 'bg-white text-slate-900';

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-amber-300/80">
                Explore
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Find your next destination
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white hover:border-amber-300/60'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
              }`}
            >
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
          <p className={`max-w-2xl text-base ${mutedText}`}>
            Search curated places to spark your next adventure. Filter by vibe, landscape,
            or the story you want to live next.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search destinations, experiences, or mood"
              className={`w-full rounded-2xl border px-5 py-4 text-base shadow-[0_0_40px_rgba(56,189,248,0.15)] outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30 ${surface} ${inputBg}`}
            />
            <span className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm ${mutedText}`}>
              {results.length} result{results.length === 1 ? '' : 's'}
            </span>
          </div>

          <div
            className={`rounded-3xl border px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.2)] ${surface}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
              Current weather
            </p>
            <h3 className="mt-2 text-lg font-semibold">
              {weatherData?.locationLabel || selected?.name || 'Select a destination'}
            </h3>
            {weatherStatus === 'loading' && (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className={`h-8 w-32 rounded-full ${surfaceSoft}`} />
                <div className={`h-4 w-24 rounded-full ${surfaceSoft}`} />
                <div className={`h-3 w-40 rounded-full ${surfaceSoft}`} />
              </div>
            )}
            {weatherStatus === 'error' && (
              <p className="mt-3 text-sm text-rose-400">{weatherError}</p>
            )}
            {weatherStatus === 'success' && weatherData && (
              <div className={`mt-3 flex flex-col gap-1 text-sm ${mutedText}`}>
                <span className="text-3xl font-semibold text-amber-200">
                  {weatherData.temperature !== null ? `${weatherData.temperature}°C` : '--'}
                </span>
                <span className="text-base font-semibold text-amber-200">
                  {weatherData.condition}
                </span>
                {weatherData.description && (
                  <span className={`text-sm ${mutedText}`}>{weatherData.description}</span>
                )}
              </div>
            )}
            {weatherStatus === 'idle' && (
              <p className={`mt-3 text-sm ${mutedText}`}>
                Select a destination to load weather.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((destination) => (
                <motion.article
                  key={destination.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`group flex h-full flex-col overflow-hidden rounded-3xl border shadow-[0_24px_60px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-amber-300/50 ${surface} ${
                    destination.id === selectedId ? 'ring-2 ring-amber-300/40' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(destination.id)}
                    className="text-left"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-5">
                      <h2 className="text-xl font-semibold">{destination.name}</h2>
                      <p className={`text-sm ${mutedText}`}>{destination.description}</p>
                      <div className="mt-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                        View details
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </button>
                </motion.article>
              ))}
            </AnimatePresence>
          </section>

          <div className={`rounded-3xl border ${surface} p-4`}> 
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
              Map preview
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              {weatherData?.coordinates ? (
                <iframe
                  title="destination-map"
                  className="h-72 w-full"
                  src={buildMapUrl(weatherData.coordinates.lat, weatherData.coordinates.lon)}
                  loading="lazy"
                />
              ) : (
                <div className={`flex h-72 items-center justify-center ${mutedText}`}>
                  Map will appear once weather loads.
                </div>
              )}
            </div>
            <p className={`mt-3 text-xs ${mutedText}`}>
              Powered by OpenStreetMap.
            </p>
          </div>
        </div>

        {results.length === 0 && (
          <div className={`rounded-3xl border border-dashed px-6 py-10 text-center ${surface}`}>
            No destinations match your search. Try a different keyword.
          </div>
        )}
      </div>
    </div>
  );
}
