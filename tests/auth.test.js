const request = require('supertest');
const app = require('../server');
const { connectTestDb, closeTestDb, clearCollections } = require('./helpers/db');

describe('Authentication API (/api/auth)', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await clearCollections();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const testUser = {
    name: 'Traveler Jane',
    email: 'jane@example.com',
    password: 'password123'
  };

  test('1. Successful user registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('2. Registration with an existing email', async () => {
    // Register first time
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    // Register second time with duplicate email
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('3. Successful login', async () => {
    // Register user first
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    // Login with correct credentials
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('4. Login with incorrect credentials', async () => {
    // Register user
    await request(app).post('/api/auth/register').send(testUser).expect(201);

    // Attempt login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('5. Accessing /api/auth/me with a valid JWT', async () => {
    // Register user and obtain JWT token
    const regRes = await request(app).post('/api/auth/register').send(testUser).expect(201);
    const token = regRes.body.token;

    // Call /me with Bearer token
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('6. Accessing /api/auth/me without authentication', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body).toHaveProperty('message');
  });
});
