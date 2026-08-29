const express = require('express');

const router = express.Router();

function parseTimeToMinutes(time) {
  if (!time) return null;
  const parts = String(time).split(':');
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getCrowdLevel(dateStr, timeStr) {
  let isWeekend = false;
  if (dateStr) {
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      const day = date.getDay();
      isWeekend = day === 0 || day === 6;
    }
  }

  if (isWeekend) return 'High';

  const minutes = parseTimeToMinutes(timeStr);
  if (minutes === null) return 'Medium';

  if (minutes >= 6 * 60 && minutes < 11 * 60) return 'Medium';
  if (minutes >= 11 * 60 && minutes < 17 * 60) return 'High';
  if (minutes >= 17 * 60 && minutes < 21 * 60) return 'Medium';
  return 'Low';
}

function handleCrowd(req, res) {
  const { location, date, time } = req.body;

  if (!location || !date || !time) {
    return res.status(400).json({
      message: 'location, date, and time are required'
    });
  }

  const crowdLevel = getCrowdLevel(date, time);

  return res.json({
    location,
    date,
    time,
    crowdLevel
  });
}

router.post('/predict-crowd', handleCrowd);
router.post('/api/crowd/predict', handleCrowd);

module.exports = router;
