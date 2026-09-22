const https = require('https');

class GeminiResponseError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'GeminiResponseError';
    this.statusCode = 502;
    this.status = status;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const TRANSIENT_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const FALLBACK_MODELS = ['gemini-3.5-flash-lite'];

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
            let errorDetail = '';
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.error?.message) {
                errorDetail = `: ${parsed.error.message}`;
              }
            } catch {
              // ignore non-json error body
            }
            const err = new GeminiResponseError(
              `Gemini API request failed with status ${response.statusCode || 'unknown'}${errorDetail}`,
              response.statusCode || 502
            );
            return reject(err);
          }
          try {
            return resolve(JSON.parse(raw));
          } catch (err) {
            return reject(new GeminiResponseError('Gemini returned an unreadable API response'));
          }
        });
      }
    );
    request.on('error', (err) => {
      const error = new GeminiResponseError(`Unable to reach Gemini: ${err.message || 'network error'}`);
      error.isNetworkError = true;
      reject(error);
    });
    request.write(data);
    request.end();
  });
}

async function postJsonWithRetry(url, body, headers = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await postJson(url, body, headers);
    } catch (err) {
      lastError = err;
      const isTransient = err.isNetworkError || (err.status && TRANSIENT_STATUS_CODES.has(err.status));
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      const delayMs = Math.min(1000 * Math.pow(2, attempt) + Math.floor(Math.random() * 200), 8000);
      console.warn(`[Gemini API] Request failed with status ${err.status || 'network'}. Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function generateStructuredJson(prompt, schema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment');

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const candidateModels = [configuredModel, ...FALLBACK_MODELS.filter((m) => m !== configuredModel)];

  let lastError;
  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await postJsonWithRetry(
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
    } catch (err) {
      lastError = err;
      const canFallback = err.status && (err.status === 503 || err.status === 500 || err.status === 502 || err.status === 504 || err.status === 404 || err.status === 429);
      if (canFallback && model !== candidateModels[candidateModels.length - 1]) {
        console.warn(`[Gemini API] Model ${model} failed with status ${err.status}. Falling back to next candidate model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new GeminiResponseError('Service unreachable. Please try again in a few moments.');
}

module.exports = { generateStructuredJson, GeminiResponseError };
