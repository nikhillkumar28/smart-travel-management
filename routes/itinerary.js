const https = require('https');

const express = require('express');

const router = express.Router();

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const target = new URL(url);

    const options = {
      method: 'POST',
      hostname: target.hostname,
      path: target.pathname + target.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(new Error('Failed to parse Gemini response JSON'));
          }
        } else {
          reject(new Error(`Gemini API error: ${res.statusCode} ${raw}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function handleGenerate(req, res) {
  try {
    const { destination, budget, days, interests } = req.body;

    if (!destination || !budget || !days || !interests) {
      return res.status(400).json({
        message: 'destination, budget, days, and interests are required'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Missing GEMINI_API_KEY in environment' });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const responseSchema = {
      type: 'object',
      properties: {
        destination: { type: 'string' },
        totalDays: { type: 'integer' },
        estimatedBudget: { type: 'string' },
        days: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'integer' },
              title: { type: 'string' },
              activities: {
                type: 'object',
                properties: {
                  morning: { type: 'string' },
                  afternoon: { type: 'string' },
                  evening: { type: 'string' }
                },
                required: ['morning', 'afternoon', 'evening']
              },
              places: { type: 'array', items: { type: 'string' } },
              food: { type: 'array', items: { type: 'string' } },
              travelTips: { type: 'string' }
            },
            required: ['day', 'title', 'activities', 'places', 'food', 'travelTips']
          }
        }
      },
      required: ['destination', 'totalDays', 'estimatedBudget', 'days']
    };

    const prompt = `Generate a travel itinerary in STRICT JSON format.\n\nRules:\n- No extra text\n- No explanation\n- Only valid JSON\n- Follow this schema:\n${JSON.stringify(responseSchema, null, 2)}\n\nInput:\nDestination: ${destination}\nDays: ${days}\nBudget: ${budget}\nInterests: ${interests}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema
      }
    };

    const data = await postJson(endpoint, body, { 'x-goog-api-key': apiKey });

    const text =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text;

    if (!text) {
      return res.status(502).json({ message: 'No content returned from Gemini' });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({
        message: 'Gemini returned non-JSON text',
        raw: text
      });
    }

    return res.json(parsed);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}

router.post('/generate-itinerary', handleGenerate);
router.post('/api/itinerary/generate', handleGenerate);

module.exports = router;
