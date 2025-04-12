import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/user.model';
import { setupTestDatabase, teardownTestDatabase, clearTestCollections } from '../utils/testUtils';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../types/user';

describe('Role-Based Access Control Tests', () => {
  let adminToken: string;
  let businessOwnerToken: string;
  let customerToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestCollections();

    // Create test users with different roles
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const admin = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true
    });

    const businessOwner = await User.create({
      email: 'owner@example.com',
      password: hashedPassword,
      role: UserRole.BUSINESS_OWNER,
      isActive: true
    });

    const customer = await User.create({
      email: 'customer@example.com',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      isActive: true
    });

    // Get tokens for each user
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    adminToken = adminLogin.body.token;

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'password123'
      });
    businessOwnerToken = ownerLogin.body.token;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'password123'
      });
    customerToken = customerLogin.body.token;
  });

  describe('Admin Access', () => {
    it('should allow admin to access admin-only endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow admin to manage business owners', async () => {
      const response = await request(app)
        .post('/api/admin/business-owners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newowner@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
    });

    it('should prevent non-admin users from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${businessOwnerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Business Owner Access', () => {
    it('should allow business owner to manage their business', async () => {
      const response = await request(app)
        .post('/api/business/menu')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          name: 'Test Item',
          price: 10.99
        });

      expect(response.status).toBe(201);
    });

    it('should prevent business owner from accessing other businesses', async () => {
      const response = await request(app)
        .get('/api/business/other-business-id/menu')
        .set('Authorization', `Bearer ${businessOwnerToken}`);

      expect(response.status).toBe(403);
    });

    it('should prevent customers from managing business', async () => {
      const response = await request(app)
        .post('/api/business/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Item',
          price: 10.99
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Customer Access', () => {
    it('should allow customers to place orders', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: 'test-product-id',
              quantity: 2
            }
          ]
        });

      expect(response.status).toBe(201);
    });

    it('should prevent customers from accessing business management', async () => {
      const response = await request(app)
        .get('/api/business/analytics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow customers to view their own orders only', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      // Verify response only contains customer's orders
      expect(response.body.orders).toHaveLength(0); // Initially empty
    });
  });

  describe('Cross-Role Access Attempts', () => {
    it('should prevent business owner from accessing admin features', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          role: UserRole.CUSTOMER
        });

      expect(response.status).toBe(403);
    });

    it('should prevent customer from accessing business management', async () => {
      const response = await request(app)
        .post('/api/business/menu')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Item',
          price: 10.99
        });

      expect(response.status).toBe(403);
    });

    it('should prevent admin from placing orders as customer', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              productId: 'test-product-id',
              quantity: 2
            }
          ]
        });

      expect(response.status).toBe(403);
    });
  });
}); 