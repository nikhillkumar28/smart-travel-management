const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');            // <-- import cors
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const itineraryRoutes = require('./routes/itinerary');
const tripsRoutes = require('./routes/trips');
const crowdRoutes = require('./routes/crowd');
const weatherRoutes = require('./routes/weather');
const placesRoutes = require('./routes/places');
const { seedPlacesIfEmpty } = require('./scripts/seedPlaces');

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS for the Vercel frontend
// - origin: true → echo the request’s Origin header (works both locally and on Render)
// - credentials: true → allows the Authorization header to be sent
// - allowedHeaders: explicitly list the headers the browser will send
const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/', itineraryRoutes);
app.use('/', crowdRoutes);
app.use('/', weatherRoutes);
app.use('/', placesRoutes);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (require.main === module) {
  if (!MONGO_URI) {
    console.error('Missing MONGO_URI in environment');
    process.exit(1);
  }

  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      try {
        await seedPlacesIfEmpty();
      } catch (seedErr) {
        console.warn('Place seed check notice:', seedErr.message);
      }
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    });
}

module.exports = app;
