import { SmokeShop } from '../../models/smokeShop.model';
import { createAdminUser, createBusinessOwner, createUserAndLogin, makeAuthenticatedRequest, expectForbidden, expectUnauthorized } from '../utils/authUtils';
import { createMockShop } from '../utils/testUtils';

describe('SmokeShop Integration Tests', () => {
  let adminToken: string;
  let ownerToken: string;
  let userToken: string;
  let testShop: any;

  beforeAll(async () => {
    // Create users with different roles
    const admin = await createAdminUser();
    const owner = await createBusinessOwner();
    const user = await createUserAndLogin();

    adminToken = admin.token;
    ownerToken = owner.token;
    userToken = user.token;

    // Create a test shop owned by the business owner
    testShop = await SmokeShop.create({
      ...createMockShop(),
      owner: owner.user._id
    });
  });

  describe('GET /api/smoke-shops', () => {
    it('should allow all authenticated users to list shops', async () => {
      const response = await makeAuthenticatedRequest('get', '/api/smoke-shops', userToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not allow unauthenticated access', async () => {
      await expectUnauthorized('get', '/api/smoke-shops');
    });
  });

  describe('GET /api/smoke-shops/:id', () => {
    it('should allow all authenticated users to view a shop', async () => {
      const response = await makeAuthenticatedRequest(
        'get',
        `/api/smoke-shops/${testShop._id}`,
        userToken
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', testShop.name);
    });

    it('should return 404 for non-existent shop', async () => {
      const response = await makeAuthenticatedRequest(
        'get',
        '/api/smoke-shops/123456789012',
        userToken
      );
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/smoke-shops', () => {
    it('should allow business owners to create shops', async () => {
      const newShop = createMockShop({ name: 'New Shop' });
      const response = await makeAuthenticatedRequest(
        'post',
        '/api/smoke-shops',
        ownerToken,
        newShop
      );
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'New Shop');
    });

    it('should not allow regular users to create shops', async () => {
      const newShop = createMockShop();
      await expectForbidden('post', '/api/smoke-shops', userToken, newShop);
    });

    it('should validate shop data', async () => {
      const invalidShop = { name: '' }; // Missing required fields
      const response = await makeAuthenticatedRequest(
        'post',
        '/api/smoke-shops',
        ownerToken,
        invalidShop
      );
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/smoke-shops/:id', () => {
    it('should allow shop owner to update their shop', async () => {
      const updateData = { name: 'Updated Shop Name' };
      const response = await makeAuthenticatedRequest(
        'put',
        `/api/smoke-shops/${testShop._id}`,
        ownerToken,
        updateData
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Shop Name');
    });

    it('should allow admin to update any shop', async () => {
      const updateData = { name: 'Admin Updated Name' };
      const response = await makeAuthenticatedRequest(
        'put',
        `/api/smoke-shops/${testShop._id}`,
        adminToken,
        updateData
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Admin Updated Name');
    });

    it('should not allow regular users to update shops', async () => {
      const updateData = { name: 'Unauthorized Update' };
      await expectForbidden(
        'put',
        `/api/smoke-shops/${testShop._id}`,
        userToken,
        updateData
      );
    });
  });

  describe('DELETE /api/smoke-shops/:id', () => {
    it('should allow admin to delete any shop', async () => {
      const response = await makeAuthenticatedRequest(
        'delete',
        `/api/smoke-shops/${testShop._id}`,
        adminToken
      );
      expect(response.status).toBe(204);
    });

    it('should not allow regular users to delete shops', async () => {
      await expectForbidden(
        'delete',
        `/api/smoke-shops/${testShop._id}`,
        userToken
      );
    });

    it('should not allow shop owner to delete their shop', async () => {
      await expectForbidden(
        'delete',
        `/api/smoke-shops/${testShop._id}`,
        ownerToken
      );
    });
  });

  describe('Product Management', () => {
    describe('POST /api/smoke-shops/:id/products', () => {
      it('should allow shop owner to add products', async () => {
        const newProduct = {
          name: 'New Product',
          description: 'A new product',
          price: 29.99,
          category: 'Accessories',
          isAvailable: true
        };

        const response = await makeAuthenticatedRequest(
          'post',
          `/api/smoke-shops/${testShop._id}/products`,
          ownerToken,
          newProduct
        );

        expect(response.status).toBe(201);
        expect(response.body.products).toContainEqual(
          expect.objectContaining({
            name: 'New Product',
            price: 29.99
          })
        );
      });

      it('should not allow regular users to add products', async () => {
        const newProduct = {
          name: 'Unauthorized Product',
          price: 19.99
        };

        await expectForbidden(
          'post',
          `/api/smoke-shops/${testShop._id}/products`,
          userToken,
          newProduct
        );
      });
    });

    describe('PUT /api/smoke-shops/:id/products/:productId', () => {
      it('should allow shop owner to update products', async () => {
        const product = testShop.products[0];
        const updateData = { price: 39.99 };

        const response = await makeAuthenticatedRequest(
          'put',
          `/api/smoke-shops/${testShop._id}/products/${product._id}`,
          ownerToken,
          updateData
        );

        expect(response.status).toBe(200);
        expect(response.body.products[0]).toHaveProperty('price', 39.99);
      });

      it('should not allow regular users to update products', async () => {
        const product = testShop.products[0];
        const updateData = { price: 49.99 };

        await expectForbidden(
          'put',
          `/api/smoke-shops/${testShop._id}/products/${product._id}`,
          userToken,
          updateData
        );
      });
    });
  });
}); 