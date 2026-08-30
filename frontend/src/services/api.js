async function getErrorMessage(response, fallback) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    return data.message || fallback;
  }
  return (await response.text()) || fallback;
}

export async function generateItinerary(data, token) {
  const response = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to generate itinerary'));
  return response.json();
}

export async function fetchTrips(token) {
  const response = await fetch('/api/trips', { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to load trips'));
  return response.json();
}

export async function fetchTrip(id, token) {
  const response = await fetch(`/api/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to load trip'));
  return response.json();
}

export async function deleteTrip(id, token) {
  const response = await fetch(`/api/trips/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to delete trip'));
}

export async function fetchWeather(city) {
  const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to fetch weather'));
  return response.json();
}

export async function predictCrowd(payload) {
  const response = await fetch('/api/crowd/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, 'Failed to predict crowd level'));
  return response.json();
}
