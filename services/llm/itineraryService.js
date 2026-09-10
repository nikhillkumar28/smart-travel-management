const {
  requirementsAnalysisSchema,
  candidateActivitiesSchema,
  finalItinerarySchema,
  buildRequirementsPrompt,
  buildCandidatesPrompt,
  buildFinalItineraryPrompt
} = require('../../prompts/itineraryPrompts');
const { generateStructuredJson, GeminiResponseError } = require('./geminiService');
const { reviewItinerary, OpenAIResponseError } = require('./openaiService');

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidRequirementsAnalysis(value) {
  return value && typeof value.travelStyle === 'string' && isStringArray(value.priorityCategories) && isStringArray(value.budgetConsiderations) && isStringArray(value.planningConstraints);
}

function isValidCandidates(value) {
  return value && Array.isArray(value.candidates) && value.candidates.length > 0 && value.candidates.every((candidate) =>
    candidate && ['name', 'category', 'description', 'estimatedCost', 'suggestedTime'].every((key) => typeof candidate[key] === 'string')
  );
}

function isValidItinerary(value) {
  return value && typeof value.destination === 'string' && Number.isInteger(value.totalDays) && typeof value.estimatedBudget === 'string' && Array.isArray(value.days) && value.days.length === value.totalDays && value.days.every((day, index) =>
    day.day === index + 1 && typeof day.title === 'string' && day.activities && typeof day.activities.morning === 'string' && typeof day.activities.afternoon === 'string' && typeof day.activities.evening === 'string' && isStringArray(day.places) && isStringArray(day.food) && typeof day.travelTips === 'string' && typeof day.estimatedCost === 'string' && typeof day.reason === 'string'
  );
}

async function generateItinerary(input) {
  const analysis = await generateStructuredJson(buildRequirementsPrompt(input), requirementsAnalysisSchema);
  if (!isValidRequirementsAnalysis(analysis)) throw new GeminiResponseError('Gemini returned an invalid requirements analysis');

  const candidates = await generateStructuredJson(buildCandidatesPrompt(input, analysis), candidateActivitiesSchema);
  if (!isValidCandidates(candidates)) throw new GeminiResponseError('Gemini returned invalid candidate activities');

  const geminiItinerary = await generateStructuredJson(buildFinalItineraryPrompt(input, analysis, candidates), finalItinerarySchema);
  if (!isValidItinerary(geminiItinerary)) throw new GeminiResponseError('Gemini returned an invalid itinerary structure');

  if (!process.env.OPENAI_API_KEY) return geminiItinerary;

  try {
    const reviewedItinerary = await reviewItinerary(input, geminiItinerary);
    if (!isValidItinerary(reviewedItinerary)) {
      throw new OpenAIResponseError('OpenAI returned an invalid itinerary review');
    }
    return reviewedItinerary;
  } catch (err) {
    if (err instanceof OpenAIResponseError) {
      console.warn(`OpenAI itinerary review skipped: ${err.message}`);
      return geminiItinerary;
    }
    throw err;
  }
}

module.exports = { generateItinerary, isValidItinerary, GeminiResponseError };
