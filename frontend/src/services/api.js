export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function getApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function getErrorMessage(response, fallback) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data.message || fallback;
  }
  return (await response.text()) || fallback;
}

export async function generateItinerary(data, token) {
  const response = await fetch(getApiUrl('/api/itinerary/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to generate itinerary'));
  return response.json();
}

export async function fetchTrips(token) {
  const response = await fetch(getApiUrl('/api/trips'), { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to load trips'));
  return response.json();
}

export async function fetchTrip(id, token) {
  const response = await fetch(getApiUrl(`/api/trips/${id}`), { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to load trip'));
  return response.json();
}

export async function deleteTrip(id, token) {
  const response = await fetch(getApiUrl(`/api/trips/${id}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete trip'));
}

export async function fetchWeather(city) {
  const response = await fetch(getApiUrl(`/api/weather/${encodeURIComponent(city)}`));
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch weather'));
  return response.json();
}

export async function predictCrowd(payload) {
  const response = await fetch(getApiUrl('/api/crowd/predict'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to predict crowd level'));
  return response.json();
}

export async function fetchPlaces(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });
  const qs = query.toString();
  const path = qs ? `/api/places?${qs}` : '/api/places';
  const response = await fetch(getApiUrl(path));
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch places'));
  return response.json();
}
