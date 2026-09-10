const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const { connectTestDb, closeTestDb, clearCollections } = require('./helpers/db');

describe('Trips API (/api/trips)', () => {
  let userAToken;
  let userBToken;
  let tripA;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearCollections();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearCollections();

    // Create User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123'
    });
    userAToken = resA.body.token;

    // Create User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123'
    });
    userBToken = resB.body.token;

    // Seed a trip for User A
    tripA = await Trip.create({
      userId: resA.body.user.id,
      destination: 'Jaipur',
      days: 3,
      budget: 15000,
      interests: 'Forts, Rajasthani Food',
      itinerary: { destination: 'Jaipur', totalDays: 3, days: [] }
    });
  });

  test('1. Authenticated user can retrieve their trips', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('trips');
    expect(Array.isArray(res.body.trips)).toBe(true);
    expect(res.body.trips.length).toBe(1);
    expect(res.body.trips[0].destination).toBe('Jaipur');
  });

  test("2. User cannot access another user's trip", async () => {
    // User B attempts to access User A's trip by ID
    const res = await request(app)
      .get(`/api/trips/${tripA._id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(404);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/not found/i);
  });

  test('3. User can delete their own trip', async () => {
    // User A deletes their own trip
    await request(app)
      .delete(`/api/trips/${tripA._id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(204);

    // Verify trip is deleted
    const deletedCheck = await Trip.findById(tripA._id);
    expect(deletedCheck).toBeNull();
  });

  test('4. Unauthorized trip access is rejected', async () => {
    // Attempt to access trips without auth token
    const res = await request(app)
      .get('/api/trips')
      .expect(401);

    expect(res.body).toHaveProperty('message');
  });
});
