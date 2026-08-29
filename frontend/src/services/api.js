export async function generateItinerary(data) {
  const response = await fetch('/api/itinerary/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate itinerary');
  }

  return response.json();
}

export async function fetchWeather(city) {
  const response = await fetch(`/api/weather/${encodeURIComponent(city)}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch weather');
  }

  return response.json();
}

export async function predictCrowd(payload) {
  const response = await fetch('/api/crowd/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to predict crowd level');
  }

  return response.json();
}
