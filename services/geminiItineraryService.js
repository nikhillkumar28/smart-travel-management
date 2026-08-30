const https = require('https');
const {
  requirementsAnalysisSchema,
  candidateActivitiesSchema,
  finalItinerarySchema,
  buildRequirementsPrompt,
  buildCandidatesPrompt,
  buildFinalItineraryPrompt
} = require('../prompts/itineraryPrompts');

class GeminiResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeminiResponseError';
    this.statusCode = 502;
  }
}

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const target = new URL(url);
    const request = https.request(
      {
        method: 'POST',
        hostname: target.hostname,
        path: target.pathname + target.search,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
      },
      (response) => {
        let raw = '';
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            return reject(new GeminiResponseError(`Gemini API request failed with status ${response.statusCode || 'unknown'}`));
          }
          try {
            return resolve(JSON.parse(raw));
          } catch (err) {
            return reject(new GeminiResponseError('Gemini returned an unreadable API response'));
          }
        });
      }
    );
    request.on('error', () => reject(new GeminiResponseError('Unable to reach Gemini')));
    request.write(data);
    request.end();
  });
}

async function generateStructuredJson(prompt, schema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment');

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await postJson(
    endpoint,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema }
    },
    { 'x-goog-api-key': apiKey }
  );
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiResponseError('Gemini returned no generated content');

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new GeminiResponseError('Gemini returned malformed JSON');
  }
}

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

  const itinerary = await generateStructuredJson(buildFinalItineraryPrompt(input, analysis, candidates), finalItinerarySchema);
  if (!isValidItinerary(itinerary)) throw new GeminiResponseError('Gemini returned an invalid itinerary structure');

  return itinerary;
}

module.exports = { generateItinerary, isValidItinerary, GeminiResponseError };
