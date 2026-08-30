const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    destination: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1 },
    budget: { type: Number, required: true, min: 0 },
    interests: { type: String, required: true, trim: true },
    itinerary: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trip', tripSchema);
