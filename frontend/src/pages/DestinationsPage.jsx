import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchPlaces, getApiUrl } from '../services/api.js';

const CITIES = ['Jaipur', 'Goa', 'Delhi', 'Mumbai', 'Udaipur', 'Manali'];

const CATEGORIES = [
  { value: 'historical', label: 'Historical' },
  { value: 'nature', label: 'Nature' },
  { value: 'food', label: 'Food' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'religious', label: 'Religious' }
];

const PRICE_LEVELS = [
  { value: 1, label: '₹ Budget (1)' },
  { value: 2, label: '₹₹ Moderate (2)' },
  { value: 3, label: '₹₹₹ Upscale (3)' },
  { value: 4, label: '₹₹₹₹ Luxury (4)' }
];

const RATING_OPTIONS = [
  { value: 4.5, label: '★ 4.5 & up' },
  { value: 4.0, label: '★ 4.0 & up' },
  { value: 3.5, label: '★ 3.5 & up' },
  { value: 3.0, label: '★ 3.0 & up' }
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
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placesError, setPlacesError] = useState('');

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [weatherError, setWeatherError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Fetch places from the MongoDB backend API whenever multi-criteria filters change
  useEffect(() => {
    let isActive = true;

    async function loadPlaces() {
      setLoading(true);
      setPlacesError('');
      try {
        const params = {};
        if (city) params.city = city;
        if (category) params.category = category;
        if (maxPrice !== '') params.maxPrice = maxPrice;
        if (minRating !== '') params.minRating = minRating;

        const data = await fetchPlaces(params);
        if (isActive) {
          const list = data.places || [];
          setPlaces(list);
          if (list.length > 0) {
            setSelectedId((prev) => (list.some((p) => p._id === prev) ? prev : list[0]._id));
          } else {
            setSelectedId(null);
          }
        }
      } catch (err) {
        if (isActive) {
          setPlacesError(err.message || 'Unable to load destinations.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadPlaces();

    return () => {
      isActive = false;
    };
  }, [city, category, maxPrice, minRating]);

  // Client-side instant keyword filter over the fetched places
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return places;
    return places.filter((place) => {
      const matchName = place.name?.toLowerCase().includes(normalized);
      const matchDesc = place.description?.toLowerCase().includes(normalized);
      const matchCity = place.city?.toLowerCase().includes(normalized);
      const matchCategory = place.category?.toLowerCase().includes(normalized);
      const matchTags = Array.isArray(place.tags) && place.tags.some((t) => t.toLowerCase().includes(normalized));
      return matchName || matchDesc || matchCity || matchCategory || matchTags;
    });
  }, [places, query]);

  const selected = useMemo(() => {
    return results.find((item) => item._id === selectedId) || results[0] || null;
  }, [results, selectedId]);

  // Weather and map preview lookup for the selected place
  useEffect(() => {
    if (!selected) {
      setWeatherData(null);
      setWeatherStatus('idle');
      return;
    }

    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setWeatherStatus('loading');
        setWeatherError('');

        const targetLocation = selected.city || selected.name;
        const response = await fetch(
          getApiUrl(`/api/weather?${new URLSearchParams({ destination: targetLocation })}`),
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

  const hasActiveFilters = Boolean(city || category || maxPrice !== '' || minRating !== '' || query);

  function clearFilters() {
    setCity('');
    setCategory('');
    setMaxPrice('');
    setMinRating('');
    setQuery('');
  }

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-amber-300/80">
                Explore Places
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
            Discover hand-picked places across India. Filter by city, category, budget, and rating to plan your journey.
          </p>
        </header>

        {/* Search Bar & Weather Preview */}
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search places by name, description, or keyword..."
                className={`w-full rounded-2xl border px-5 py-4 text-base shadow-[0_0_40px_rgba(56,189,248,0.15)] outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30 ${surface} ${inputBg}`}
              />
              <span className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm ${mutedText}`}>
                {results.length} result{results.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Multi-criteria Filter Bar */}
            <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${surface}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300/90 mr-1">
                <span>Filter:</span>
              </div>

              {/* City Filter */}
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Filter by City"
                className={`rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 ${inputBg} ${surface}`}
              >
                <option value="" className="bg-slate-900 text-white">All Cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by Category"
                className={`rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 ${inputBg} ${surface}`}
              >
                <option value="" className="bg-slate-900 text-white">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">{cat.label}</option>
                ))}
              </select>

              {/* Max Price Filter */}
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                aria-label="Filter by Max Price"
                className={`rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 ${inputBg} ${surface}`}
              >
                <option value="" className="bg-slate-900 text-white">Max Budget (Any)</option>
                {PRICE_LEVELS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-slate-900 text-white">{p.label}</option>
                ))}
              </select>

              {/* Min Rating Filter */}
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : '')}
                aria-label="Filter by Minimum Rating"
                className={`rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 ${inputBg} ${surface}`}
              >
                <option value="" className="bg-slate-900 text-white">Min Rating (Any)</option>
                {RATING_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900 text-white">{r.label}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline ml-auto transition"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Current Weather Card */}
          <div
            className={`rounded-3xl border px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.2)] ${surface}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
              Current weather
            </p>
            <h3 className="mt-2 text-lg font-semibold">
              {weatherData?.locationLabel || selected?.name || (loading ? 'Loading...' : 'Select a place')}
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
                Select a destination to view live weather.
              </p>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {placesError && (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
            {placesError}
          </div>
        )}

        {/* Places Grid and Map Section */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-300 border-t-transparent mb-3" />
                <p>Loading curated destinations...</p>
              </div>
            ) : results.length === 0 ? (
              <div className={`col-span-full rounded-3xl border border-dashed px-6 py-12 text-center ${surface}`}>
                <p className="text-base font-medium">No destinations match your search and filter criteria.</p>
                <p className={`mt-1 text-sm ${mutedText}`}>Try clearing some filters or searching for a different keyword.</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 inline-block rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-200"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {results.map((place) => {
                  const isSelected = place._id === selected?._id;
                  return (
                    <motion.article
                      key={place._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className={`group flex h-full flex-col overflow-hidden rounded-3xl border shadow-[0_24px_60px_rgba(15,23,42,0.2)] transition hover:-translate-y-1 hover:border-amber-300/50 ${surface} ${
                        isSelected ? 'ring-2 ring-amber-300/70 border-amber-300/50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(place._id)}
                        className="flex flex-1 flex-col text-left"
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                          {place.image ? (
                            <img
                              src={place.image}
                              alt={place.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image available
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-950/80 backdrop-blur px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-300/30">
                            <span>★</span>
                            <span>{place.rating}</span>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 border border-amber-400/20">
                              {place.city}
                            </span>
                            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium capitalize text-slate-200 border border-white/10">
                              {place.category}
                            </span>
                            <span className="ml-auto text-xs font-semibold text-slate-400">
                              {'₹'.repeat(place.priceLevel || 1)}
                            </span>
                          </div>

                          <div>
                            <h2 className="text-xl font-semibold leading-tight">{place.name}</h2>
                            <p className={`mt-2 line-clamp-2 text-sm ${mutedText}`}>{place.description}</p>
                          </div>

                          {place.tags && place.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {place.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[11px] text-slate-400 bg-white/5 rounded px-1.5 py-0.5"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-auto pt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80 group-hover:text-amber-300">
                            View details
                            <span aria-hidden="true">→</span>
                          </div>
                        </div>
                      </button>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            )}
          </section>

          {/* Map Preview */}
          <div className={`rounded-3xl border ${surface} p-4 h-fit sticky top-6`}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
              Map preview
            </p>
            <h4 className="text-base font-semibold mt-1">
              {selected ? `${selected.name} (${selected.city})` : 'Map'}
            </h4>
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
              {weatherData?.coordinates ? (
                <iframe
                  title="destination-map"
                  className="h-72 w-full"
                  src={buildMapUrl(weatherData.coordinates.lat, weatherData.coordinates.lon)}
                  loading="lazy"
                />
              ) : (
                <div className={`flex h-72 items-center justify-center text-sm ${mutedText} px-4 text-center`}>
                  {weatherStatus === 'loading'
                    ? 'Locating on map...'
                    : 'Map will appear once place coordinates are loaded.'}
                </div>
              )}
            </div>
            <p className={`mt-3 text-xs ${mutedText}`}>
              Live coordinates via OpenWeather &amp; OpenStreetMap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
