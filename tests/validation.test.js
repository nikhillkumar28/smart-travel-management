const request = require('supertest');

// Mock external Gemini service before requiring app so no real LLM API calls are ever made
jest.mock('../services/geminiItineraryService', () => ({
  generateItinerary: jest.fn().mockResolvedValue({
    destination: 'Goa',
    totalDays: 3,
    estimatedBudget: '₹15,000',
    days: [
      {
        day: 1,
        title: 'Arrival and Beach',
        activities: { morning: 'Check in', afternoon: 'Relax', evening: 'Sunset at Anjuna' },
        places: ['Anjuna Beach'],
        food: ['Goan Thali'],
        travelTips: 'Carry sunscreen',
        estimatedCost: '₹3,000',
        reason: 'Gentle introduction to the coast'
      },
      {
        day: 2,
        title: 'Heritage Exploration',
        activities: { morning: 'Visit churches', afternoon: 'Spice plantation', evening: 'Dinner' },
        places: ['Old Goa'],
        food: ['Vindaloo'],
        travelTips: 'Wear walking shoes',
        estimatedCost: '₹3,500',
        reason: 'Cultural immersion'
      },
      {
        day: 3,
        title: 'Water Sports',
        activities: { morning: 'Water skiing', afternoon: 'Cafe hopping', evening: 'Night market' },
        places: ['Baga Beach'],
        food: ['Seafood grill'],
        travelTips: 'Stay hydrated',
        estimatedCost: '₹4,000',
        reason: 'Adventure and lively nightlife'
      }
    ]
  }),
  isValidItinerary: jest.fn().mockReturnValue(true),
  GeminiResponseError: class GeminiResponseError extends Error {
    constructor(message) {
      super(message);
      this.name = 'GeminiResponseError';
      this.statusCode = 502;
    }
  }
}));

const app = require('../server');
const { connectTestDb, closeTestDb, clearCollections } = require('./helpers/db');

describe('Itinerary Generation Input Validation (/api/itinerary/generate)', () => {
  let userToken;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearCollections();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearCollections();

    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Validation Tester',
      email: 'validation@example.com',
      password: 'password123'
    });
    userToken = regRes.body.token;
  });

  test('1. Missing destination', async () => {
    const res = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: '',
        days: 3,
        budget: 10000,
        interests: 'history, temples'
      })
      .expect(400);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/destination/i);
  });

  test('2. Invalid number of days', async () => {
    // 0 days
    const resZero = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Jaipur',
        days: 0,
        budget: 10000,
        interests: 'history'
      })
      .expect(400);

    expect(resZero.body.message).toMatch(/days must be at least 1/i);

    // Negative days
    await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Jaipur',
        days: -3,
        budget: 10000,
        interests: 'history'
      })
      .expect(400);

    // Non-integer days
    await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Jaipur',
        days: 'two',
        budget: 10000,
        interests: 'history'
      })
      .expect(400);
  });

  test('3. Invalid budget', async () => {
    // Negative budget
    const resNegative = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Goa',
        days: 3,
        budget: -500,
        interests: 'beaches'
      })
      .expect(400);

    expect(resNegative.body.message).toMatch(/budget cannot be negative/i);

    // Non-numeric budget
    await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Goa',
        days: 3,
        budget: 'free',
        interests: 'beaches'
      })
      .expect(400);
  });

  test('4. Invalid interests format', async () => {
    // Empty string interests
    const resEmpty = await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Goa',
        days: 3,
        budget: 10000,
        interests: '   '
      })
      .expect(400);

    expect(resEmpty.body).toHaveProperty('message');

    // Non-string interests (e.g. number/boolean)
    await request(app)
      .post('/api/itinerary/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        destination: 'Goa',
        days: 3,
        budget: 10000,
        interests: 12345
      })
      .expect(400);
  });
});
