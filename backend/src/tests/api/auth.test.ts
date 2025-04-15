import request from 'supertest';
import app from '../../app';
import { setupTestEnv, teardownTestEnv, clearTestData, testUserData } from '../setupTestEnv';
import { UserModel } from '../../models/user.model';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });

  afterAll(async () => {
    await teardownTestEnv();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: testUserData.email,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName,
        role: testUserData.role,
      });
    });

    it('should not register with existing email', async () => {
      // Create a user first
      await UserModel.create(testUserData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await UserModel.create(testUserData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: testUserData.email,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName,
        role: testUserData.role,
      });
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserData.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      // Create a user and get token
      await UserModel.create(testUserData);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });
      token = loginResponse.body.token;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: testUserData.email,
        firstName: testUserData.firstName,
        lastName: testUserData.lastName,
        role: testUserData.role,
      });
    });

    it('should not get current user without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should not get current user with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });
}); 