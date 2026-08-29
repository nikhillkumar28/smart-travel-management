const https = require('https');
const express = require('express');

const router = express.Router();

const CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = new Map();

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw));
            } catch (err) {
              reject(new Error('Failed to parse OpenWeather response'));
            }
          } else {
            reject(new Error(`OpenWeather error: ${res.statusCode} ${raw}`));
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

async function handleWeather(req, res) {
  try {
    const destination = req.params.city || req.query.destination;
    if (!destination) {
      return res.status(400).json({ message: 'destination is required' });
    }

    const cacheKey = destination.trim().toLowerCase();
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Missing OPENWEATHER_API_KEY in environment' });
    }

    const geoUrl =
      'https://api.openweathermap.org/geo/1.0/direct?' +
      new URLSearchParams({
        q: destination,
        limit: '1',
        appid: apiKey
      });

    const geoJson = await getJson(geoUrl);
    if (!Array.isArray(geoJson) || geoJson.length === 0) {
      return res.status(404).json({ message: 'No coordinates found for destination' });
    }

    const { lat, lon, name, country, state } = geoJson[0];

    const weatherUrl =
      'https://api.openweathermap.org/data/2.5/weather?' +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        units: 'metric',
        appid: apiKey
      });

    const weatherJson = await getJson(weatherUrl);
    const temp = weatherJson?.main?.temp;
    const condition = weatherJson?.weather?.[0]?.main;
    const description = weatherJson?.weather?.[0]?.description;

    const payload = {
      temperature: typeof temp === 'number' ? Math.round(temp) : null,
      condition: condition || 'Unknown',
      description: description || '',
      coordinates: { lat, lon },
      locationLabel: [name, state, country].filter(Boolean).join(', ')
    };

    weatherCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}

router.get('/api/weather', handleWeather);
router.get('/api/weather/:city', handleWeather);

module.exports = router;
