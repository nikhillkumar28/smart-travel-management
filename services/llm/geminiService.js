const https = require('https');

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

module.exports = { generateStructuredJson, GeminiResponseError };
