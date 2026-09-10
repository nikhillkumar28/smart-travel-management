const mongoose = require('mongoose');

const CATEGORIES = ['historical', 'nature', 'food', 'adventure', 'cultural', 'religious'];

const placeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      lowercase: true,
      trim: true
    },
    // 1 = budget, 4 = expensive
    priceLevel: { type: Number, required: true, min: 1, max: 4 },
    rating: { type: Number, required: true, min: 0, max: 5 },
    tags: [{ type: String, trim: true, lowercase: true }],
    description: { type: String, required: true, trim: true },
    image: { type: String, trim: true }
  },
  { timestamps: true }
);

// Most common query: city + category + max price, sorted by rating.
// Adheres to ESR (Equality, Sort, Range) rule:
// E: city: 1, category: 1
// S: rating: -1 (allows index-provided sort order without in-memory SORT)
// R: priceLevel: 1 ($lte range query)
placeSchema.index({ city: 1, category: 1, rating: -1, priceLevel: 1 });

module.exports = mongoose.model('Place', placeSchema);
module.exports.CATEGORIES = CATEGORIES;
