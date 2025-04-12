import request from 'supertest';
import { app } from '../../app';
import { User } from '../../models/user.model';
import { Order } from '../../models/order.model';
import { setupTestDatabase, teardownTestDatabase, clearTestCollections } from '../utils/testUtils';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../types/user';
import { PaymentStatus, OrderStatus } from '../../types/order';

describe('Payment and Reservation Integration Tests', () => {
  let customerToken: string;
  let businessOwnerToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestCollections();

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const customer = await User.create({
      email: 'customer@example.com',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      isActive: true
    });

    const businessOwner = await User.create({
      email: 'owner@example.com',
      password: hashedPassword,
      role: UserRole.BUSINESS_OWNER,
      isActive: true
    });

    // Get tokens
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@example.com',
        password: 'password123'
      });
    customerToken = customerLogin.body.token;

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'password123'
      });
    businessOwnerToken = ownerLogin.body.token;

    // Create a test order
    const order = await Order.create({
      userId: customer._id,
      items: [
        {
          productId: 'test-product-id',
          quantity: 2,
          price: 10.99,
          name: 'Test Product'
        }
      ],
      totalAmount: 21.98,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING
    });
    testOrderId = order._id.toString();
  });

  describe('Payment Processing', () => {
    it('should process payment successfully', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentId');
      expect(response.body.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should handle payment failure', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4000000000000002', // Simulated declined card
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(PaymentStatus.FAILED);
    });

    it('should prevent duplicate payments', async () => {
      // First payment
      await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      // Attempt duplicate payment
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Payment already processed');
    });
  });

  describe('Reservation Flow', () => {
    it('should create a reservation successfully', async () => {
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          businessId: 'test-business-id',
          date: '2024-04-20',
          time: '19:00',
          partySize: 4,
          specialRequests: 'Window seat preferred'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('reservationId');
      expect(response.body.status).toBe('confirmed');
    });

    it('should handle reservation conflicts', async () => {
      // First reservation
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          businessId: 'test-business-id',
          date: '2024-04-20',
          time: '19:00',
          partySize: 4
        });

      // Attempt conflicting reservation
      const response = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          businessId: 'test-business-id',
          date: '2024-04-20',
          time: '19:00',
          partySize: 6
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Time slot already reserved');
    });

    it('should allow business owner to manage reservations', async () => {
      // Create a reservation
      const createResponse = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          businessId: 'test-business-id',
          date: '2024-04-20',
          time: '19:00',
          partySize: 4
        });

      const reservationId = createResponse.body.reservationId;

      // Update reservation as business owner
      const updateResponse = await request(app)
        .patch(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          status: 'confirmed',
          notes: 'Table prepared'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('confirmed');
    });
  });

  describe('Refund Processing', () => {
    it('should process refund successfully', async () => {
      // First process payment
      await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      // Request refund
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/refund`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reason: 'Customer request'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('refunded');
    });

    it('should prevent refund for unpaid orders', async () => {
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/refund`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reason: 'Customer request'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Order not paid');
    });

    it('should handle partial refunds', async () => {
      // Process payment
      await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          paymentMethod: 'credit_card',
          cardNumber: '4242424242424242',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        });

      // Request partial refund
      const response = await request(app)
        .post(`/api/orders/${testOrderId}/refund`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reason: 'Partial refund',
          amount: 10.99
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('partially_refunded');
      expect(response.body.refundAmount).toBe(10.99);
    });
  });
}); 