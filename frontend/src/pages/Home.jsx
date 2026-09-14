import { useState } from 'react';
import { fetchWeather, generateItinerary, predictCrowd } from '../services/api.js';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ItineraryCard from '../components/ItineraryCard.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import CrowdCard from '../components/CrowdCard.jsx';

function getLocalDateTime() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);
  return { date, time };
}

export default function Home() {
  const { isAuthenticated, token } = useAuth();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(15000);
  const [interests, setInterests] = useState('Beaches, food');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('idle');
  const [weatherError, setWeatherError] = useState('');
  const [crowd, setCrowd] = useState(null);
  const [crowdStatus, setCrowdStatus] = useState('idle');
  const [crowdError, setCrowdError] = useState('');
  const [formError, setFormError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isAuthenticated || !token) {
      setFormError('Please log in to generate and save a trip.');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError('');
      setWeatherStatus('loading');
      setWeatherError('');
      setCrowdStatus('loading');
      setCrowdError('');

      const { date, time } = getLocalDateTime();

      const [weatherData, itineraryData, crowdData] = await Promise.all([
        fetchWeather(destination),
        generateItinerary({
          destination,
          days,
          budget,
          interests
        }, token),
        predictCrowd({ location: destination, date, time })
      ]);

      setWeather(weatherData);
      setWeatherStatus('success');
      setItinerary(itineraryData);
      setCrowd(crowdData);
      setCrowdStatus('success');
      console.log('Itinerary response:', itineraryData);
    } catch (err) {
      console.error('Itinerary error:', err);
      setWeatherStatus('error');
      setWeatherError(err.message || 'Unable to fetch weather.');
      setCrowdStatus('error');
      setCrowdError(err.message || 'Unable to predict crowd.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-72px)] flex-col items-center gap-10 px-6 py-12">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-10 top-20 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute right-10 top-40 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/10 p-8 shadow-lg backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Plan Your Trip 
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Share your destination and trip length to get a tailored plan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="e.g., Jagannath Puri"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Number of Days</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Budget</label>
            <input
              type="number"
              min={0}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">Interests</label>
            <input
              type="text"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="e.g., Temples,Food"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/30"
            />
          </div>

          {formError && (
            <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {formError} {!isAuthenticated && <Link to="/login" className="font-semibold underline">Log in</Link>}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
                Generating plan...
              </>
            ) : (
              'Generate Plan'
            )}
          </button>
        </form>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        <WeatherCard
          status={weatherStatus}
          weather={weather}
          error={weatherError}
          destination={destination}
        />
        <CrowdCard
          status={crowdStatus}
          crowd={crowd}
          error={crowdError}
          destination={destination}
        />
      </div>

      <div
        className={`grid w-full max-w-5xl gap-6 md:grid-cols-2 transition-all duration-500 ${
          itinerary?.days?.length ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {itinerary?.days?.map((day) => (
          <ItineraryCard key={day.day} day={day} />
        ))}
      </div>
    </section>
  );
}
