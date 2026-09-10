const https = require('https');
const { finalItinerarySchema, buildReviewPrompt } = require('../../prompts/itineraryPrompts');

class OpenAIResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OpenAIResponseError';
  }
}

function makeStrictSchema(schema) {
  const copy = JSON.parse(JSON.stringify(schema));
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'object' && node.properties) {
      node.additionalProperties = false;
      Object.values(node.properties).forEach(visit);
    }
    if (node.type === 'array') visit(node.items);
  }
  visit(copy);
  return copy;
}

function postJson(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const request = https.request(
      {
        method: 'POST',
        hostname: 'api.openai.com',
        path: '/v1/responses',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (response) => {
        let raw = '';
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            return reject(new OpenAIResponseError(`OpenAI review request failed with status ${response.statusCode || 'unknown'}`));
          }
          try {
            return resolve(JSON.parse(raw));
          } catch (err) {
            return reject(new OpenAIResponseError('OpenAI returned an unreadable API response'));
          }
        });
      }
    );
    request.on('error', () => reject(new OpenAIResponseError('Unable to reach OpenAI')));
    request.write(data);
    request.end();
  });
}

function getOutputText(response) {
  if (response.output_text) return response.output_text;
  const outputText = response.output
    ?.flatMap((item) => item.content || [])
    .find((content) => content.type === 'output_text')?.text;
  return outputText || null;
}

async function reviewItinerary(input, itinerary) {
  if (!process.env.OPENAI_API_KEY) {
    throw new OpenAIResponseError('OPENAI_API_KEY is not configured');
  }

  const response = await postJson({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    instructions: 'You are a careful travel-itinerary reviewer. Return only the requested structured result.',
    input: buildReviewPrompt(input, itinerary),
    text: {
      format: {
        type: 'json_schema',
        name: 'reviewed_itinerary',
        strict: true,
        schema: makeStrictSchema(finalItinerarySchema)
      }
    },
    store: false
  });
  const text = getOutputText(response);
  if (!text) throw new OpenAIResponseError('OpenAI returned no review content');

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new OpenAIResponseError('OpenAI returned malformed review JSON');
  }
}

module.exports = { reviewItinerary, OpenAIResponseError };
