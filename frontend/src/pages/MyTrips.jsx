import { useEffect, useState } from 'react';
import ItineraryCard from '../components/ItineraryCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteTrip, fetchTrip, fetchTrips } from '../services/api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

export default function MyTrips() {
  const { token, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    let isActive = true;
    fetchTrips(token)
      .then(({ trips: savedTrips }) => {
        if (isActive) {
          setTrips(savedTrips);
          setStatus('success');
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err.message || 'Unable to load trips.');
          setStatus('error');
        }
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  async function handleView(id) {
    try {
      setActionId(id);
      setError('');
      const { trip } = await fetchTrip(id, token);
      setSelectedTrip(trip);
    } catch (err) {
      setError(err.message || 'Unable to load the itinerary.');
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this saved trip?')) return;
    try {
      setActionId(id);
      setError('');
      await deleteTrip(id, token);
      setTrips((currentTrips) => currentTrips.filter((trip) => trip._id !== id));
      if (selectedTrip?._id === id) setSelectedTrip(null);
    } catch (err) {
      setError(err.message || 'Unable to delete the trip.');
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">My Trips</p>
        <h1 className="mt-3 text-3xl font-semibold">Welcome, {user?.name || 'traveler'}.</h1>
        <p className="mt-2 text-slate-300">Your generated itineraries are saved here.</p>
      </header>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      {status === 'loading' && <p className="mt-6 text-slate-300">Loading your trips...</p>}
      {status === 'success' && trips.length === 0 && <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">You have no saved trips yet. Generate one from Home to see it here.</p>}

      <div className="mt-6 grid gap-4">
        {trips.map((trip) => (
          <article key={trip._id} className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <h2 className="text-xl font-semibold">{trip.destination}</h2>
                <dl className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                  <div><dt className="inline font-semibold text-slate-100">Days: </dt><dd className="inline">{trip.days}</dd></div>
                  <div><dt className="inline font-semibold text-slate-100">Budget: </dt><dd className="inline">{trip.budget}</dd></div>
                  <div className="sm:col-span-2"><dt className="inline font-semibold text-slate-100">Interests: </dt><dd className="inline">{trip.interests}</dd></div>
                  <div className="sm:col-span-2"><dt className="inline font-semibold text-slate-100">Created: </dt><dd className="inline">{formatDate(trip.createdAt)}</dd></div>
                </dl>
              </div>
              <div className="flex shrink-0 items-start gap-3">
                <button type="button" onClick={() => handleView(trip._id)} disabled={actionId === trip._id} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-amber-300/70 hover:text-amber-200 disabled:opacity-60">{actionId === trip._id ? 'Loading...' : 'View'}</button>
                <button type="button" onClick={() => handleDelete(trip._id)} disabled={actionId === trip._id} className="rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/10 disabled:opacity-60">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedTrip && (
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Saved itinerary</p>
              <h2 className="mt-2 text-2xl font-semibold">{selectedTrip.destination}</h2>
            </div>
            <button type="button" onClick={() => setSelectedTrip(null)} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-amber-300/70 hover:text-amber-200">Close</button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {selectedTrip.itinerary?.days?.map((day) => <ItineraryCard key={day.day} day={day} />)}
          </div>
        </section>
      )}
    </section>
  );
}
