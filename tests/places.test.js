const request = require('supertest');
const app = require('../server');
const Place = require('../models/Place');
const { connectTestDb, closeTestDb, clearCollections } = require('./helpers/db');

describe('Places Search API (/api/places)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearCollections();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearCollections();

    // Seed realistic sample places into test database
    await Place.insertMany([
      {
        name: 'Amber Fort',
        city: 'Jaipur',
        category: 'historical',
        priceLevel: 2,
        rating: 4.7,
        tags: ['fort', 'unesco'],
        description: 'Hilltop Rajput fort overlooking Maota Lake.'
      },
      {
        name: 'Hawa Mahal',
        city: 'Jaipur',
        category: 'historical',
        priceLevel: 1,
        rating: 4.4,
        tags: ['palace', 'windows'],
        description: 'Pink sandstone palace with 953 windows.'
      },
      {
        name: 'City Palace Jaipur',
        city: 'Jaipur',
        category: 'cultural',
        priceLevel: 3,
        rating: 4.5,
        tags: ['palace', 'museum'],
        description: 'Royal complex of museums and courtyards.'
      },
      {
        name: 'Baga Beach',
        city: 'Goa',
        category: 'nature',
        priceLevel: 2,
        rating: 4.3,
        tags: ['beach', 'shacks'],
        description: 'Lively beach stretch with water sports.'
      },
      {
        name: 'Dudhsagar Falls',
        city: 'Goa',
        category: 'adventure',
        priceLevel: 2,
        rating: 4.6,
        tags: ['waterfall', 'trek'],
        description: 'Four-tiered waterfall on Goa-Karnataka border.'
      }
    ]);
  });

  test('1. Search by city', async () => {
    const res = await request(app)
      .get('/api/places?city=Jaipur')
      .expect(200);

    expect(res.body).toHaveProperty('places');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.places.length).toBe(3);

    // Verify all returned places belong to Jaipur
    res.body.places.forEach((place) => {
      expect(place.city).toBe('Jaipur');
    });

    // Verify results are sorted by rating descending
    const ratings = res.body.places.map((p) => p.rating);
    expect(ratings).toEqual([4.7, 4.5, 4.4]);
  });

  test('2. Search using multiple filters', async () => {
    // Filter by city=Jaipur AND category=historical AND maxPrice=2
    const res = await request(app)
      .get('/api/places?city=Jaipur&category=historical&maxPrice=2')
      .expect(200);

    expect(res.body.places.length).toBe(2);

    // Should include Amber Fort (price 2) and Hawa Mahal (price 1), but not City Palace (price 3, cultural)
    const names = res.body.places.map((p) => p.name);
    expect(names).toContain('Amber Fort');
    expect(names).toContain('Hawa Mahal');
    expect(names).not.toContain('City Palace Jaipur');

    // Each place should meet all criteria
    res.body.places.forEach((place) => {
      expect(place.city).toBe('Jaipur');
      expect(place.category).toBe('historical');
      expect(place.priceLevel).toBeLessThanOrEqual(2);
    });
  });

  test('3. Invalid query parameters', async () => {
    // Invalid category
    const resCategory = await request(app)
      .get('/api/places?category=outerspace')
      .expect(400);
    expect(resCategory.body.message).toMatch(/category must be one of/i);

    // Invalid maxPrice (> 4)
    const resPrice = await request(app)
      .get('/api/places?maxPrice=10')
      .expect(400);
    expect(resPrice.body.message).toMatch(/maxPrice must be an integer from 1 to 4/i);

    // Invalid minRating (> 5)
    const resRating = await request(app)
      .get('/api/places?minRating=6')
      .expect(400);
    expect(resRating.body.message).toMatch(/minRating must be a number from 0 to 5/i);

    // Invalid limit (> 50)
    const resLimit = await request(app)
      .get('/api/places?limit=999')
      .expect(400);
    expect(resLimit.body.message).toMatch(/limit must be an integer from 1 to 50/i);
  });
});
