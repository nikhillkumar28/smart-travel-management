const express = require('express');
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');
const { generateItinerary, isValidItinerary, GeminiResponseError } = require('../services/geminiItineraryService');

const router = express.Router();

function getTripInput(body) {
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const interests = typeof body.interests === 'string' ? body.interests.trim() : '';
  const days = Number(body.days);
  const budget = Number(body.budget);

  if (!destination || !interests || !Number.isInteger(days) || days < 1 || !Number.isFinite(budget) || budget < 0) {
    return null;
  }

  return { destination, days, budget, interests };
}

async function handleGenerate(req, res) {
  const input = getTripInput(req.body);
  if (!input) {
    return res.status(400).json({
      message: 'destination, days, budget, and interests are required; days must be at least 1 and budget cannot be negative'
    });
  }

  try {
    const itinerary = await generateItinerary(input);

    // This route checks again before persistence so no malformed model output is saved.
    if (!isValidItinerary(itinerary) || itinerary.totalDays !== input.days) {
      return res.status(502).json({ message: 'Service unreachable. Please try again in a few moments.' });
    }

    const trip = await Trip.create({ userId: req.user.id, ...input, itinerary });
    return res.status(201).json({ ...itinerary, tripId: trip._id });
  } catch (err) {
    console.error('[Itinerary Generation Error]', err.message || err);
    if (err instanceof GeminiResponseError) {
      return res.status(err.statusCode || 502).json({
        message: 'Service unreachable. Please try again in a few moments.'
      });
    }
    if (err.message === 'Missing GEMINI_API_KEY in environment') {
      return res.status(500).json({
        message: 'Service unreachable. Please try again in a few moments.'
      });
    }
    return res.status(500).json({ message: 'Service unreachable. Please try again in a few moments.' });
  }
}

router.post('/generate-itinerary', authMiddleware, handleGenerate);
router.post('/api/itinerary/generate', authMiddleware, handleGenerate);

module.exports = router;
