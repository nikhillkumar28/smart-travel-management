const Place = require('../models/Place');

const CATEGORIES = Place.CATEGORIES;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function parseNumber(value) {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseQuery(query) {
  const city = typeof query.city === 'string' ? query.city.trim() : '';
  const category = typeof query.category === 'string' ? query.category.trim().toLowerCase() : '';
  const maxPrice = parseNumber(query.maxPrice);
  const minRating = parseNumber(query.minRating);
  const page = parsePositiveInt(query.page, 1);
  const limit = parsePositiveInt(query.limit, DEFAULT_LIMIT);
  const explain = query.explain === 'true' || query.explain === '1';

  const errors = [];

  if (category && !CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (maxPrice !== undefined && (!Number.isInteger(maxPrice) || maxPrice < 1 || maxPrice > 4)) {
    errors.push('maxPrice must be an integer from 1 to 4');
  }
  if (minRating !== undefined && (Number.isNaN(minRating) || minRating < 0 || minRating > 5)) {
    errors.push('minRating must be a number from 0 to 5');
  }
  if (!Number.isInteger(page) || page < 1) {
    errors.push('page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    errors.push(`limit must be an integer from 1 to ${MAX_LIMIT}`);
  }

  return { errors, city, category, maxPrice, minRating, page, limit, explain };
}

function buildFilter({ city, category, maxPrice, minRating }) {
  const filter = {};
  // Equality on city so the compound index prefix can be used.
  if (city) {
    const trimmed = city.trim();
    const titleCase = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (trimmed !== titleCase) {
      filter.city = { $in: [trimmed, titleCase] };
    } else {
      filter.city = trimmed;
    }
  }
  if (category) filter.category = category;
  if (maxPrice !== undefined) filter.priceLevel = { $lte: maxPrice };
  if (minRating !== undefined) filter.rating = { $gte: minRating };
  return filter;
}

function summarizeExplain(explanation) {
  const winningPlan = explanation?.queryPlanner?.winningPlan || null;
  const executionStats = explanation?.executionStats || null;
  const stages = [];

  function walk(plan) {
    if (!plan) return;
    if (plan.stage) stages.push(plan.stage);
    if (plan.inputStage) walk(plan.inputStage);
    if (Array.isArray(plan.inputStages)) plan.inputStages.forEach(walk);
  }

  walk(winningPlan);

  return {
    winningStages: stages,
    indexName: findIndexName(winningPlan),
    docsExamined: executionStats?.totalDocsExamined,
    keysExamined: executionStats?.totalKeysExamined,
    nReturned: executionStats?.nReturned
  };
}

function findIndexName(plan) {
  if (!plan) return null;
  if (plan.stage === 'IXSCAN') return plan.indexName || null;
  if (plan.inputStage) return findIndexName(plan.inputStage);
  if (Array.isArray(plan.inputStages)) {
    for (const child of plan.inputStages) {
      const name = findIndexName(child);
      if (name) return name;
    }
  }
  return null;
}

async function getPlaces(req, res) {
  const parsed = parseQuery(req.query);
  if (parsed.errors.length > 0) {
    return res.status(400).json({ message: parsed.errors.join('; ') });
  }

  const filter = buildFilter(parsed);
  const skip = (parsed.page - 1) * parsed.limit;
  const findQuery = Place.find(filter).sort({ rating: -1 }).skip(skip).limit(parsed.limit);

  try {
    const [places, total] = await Promise.all([
      findQuery.lean(),
      Place.countDocuments(filter)
    ]);

    const payload = {
      places,
      pagination: {
        page: parsed.page,
        limit: parsed.limit,
        total,
        totalPages: Math.ceil(total / parsed.limit) || 0
      }
    };

    if (parsed.explain) {
      const explanation = await Place.find(filter).sort({ rating: -1 }).explain('executionStats');
      payload.explain = summarizeExplain(explanation);
    }

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to search places' });
  }
}

module.exports = { getPlaces };
