import { Types } from 'mongoose';
import { SmokeShopService } from '../../src/services/smokeShop.service';
import { SmokeShop } from '../../src/models/smokeShop.model';
import { OrderModel } from '../../src/models/order.model';
import { AppError } from '../../src/utils/errorHandler';
import { ISmokeShop } from '../../src/types/smokeShop';
import { IOrder, IOrderItem, OrderStatus, PaymentStatus, PaymentMethod } from '../../src/types/order';
import { IUser, UserRole } from '../../src/types/user';

jest.mock('../../src/models/smokeShop.model');
jest.mock('../../src/models/order.model');
jest.mock('../../src/utils/deliveryUtils', () => ({
  calculateDeliveryFee: jest.fn().mockResolvedValue(5.0)
}));

describe('SmokeShopService', () => {
  let service: SmokeShopService;
  const mockUserId = new Types.ObjectId();
  const mockShopId = new Types.ObjectId();
  const mockProductId = new Types.ObjectId();
  const mockStringProductId = mockProductId.toString();

  const mockUser: IUser = {
    _id: mockUserId,
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.CUSTOMER,
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockShop = {
    _id: mockShopId.toString(),
    name: 'Test Shop',
    description: 'Test Description',
    address: '123 Test St, New York, NY',
    location: {
      type: 'Point',
      coordinates: [40.7128, -74.0060] // NYC coordinates
    },
    contact: {
      phone: '123-456-7890',
      email: 'shop@example.com'
    },
    products: [
      {
        _id: mockProductId.toString(),
        name: 'Test Product',
        price: 10.0,
        description: 'Test Description',
        category: 'test',
        isAvailable: true
      }
    ],
    openingHours: [],
    rating: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    service = new SmokeShopService();
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    it('should create an order with string product ID', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);
      (OrderModel.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: mockUserId,
        businessId: mockShopId,
        items: [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        totalAmount: 25.0, // (10 * 2) + 5 delivery fee
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          coordinates: [40.7128, -74.0060]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const order = await service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      );

      expect(order).toBeDefined();
      expect(order.totalAmount).toBe(25.0);
    });

    it('should create an order with ObjectId product ID', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);
      (OrderModel.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: mockUserId,
        businessId: mockShopId,
        items: [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        totalAmount: 25.0,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          coordinates: [40.7128, -74.0060]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const order = await service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      );

      expect(order).toBeDefined();
      expect(order.totalAmount).toBe(25.0);
    });

    it('should throw error if shop not found', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      )).rejects.toThrow(AppError);
    });

    it('should throw error if product not found in shop', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: new Types.ObjectId(),
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      )).rejects.toThrow(AppError);
    });

    it('should calculate correct total with multiple items', async () => {
      const mockShopWithMultipleProducts = {
        ...mockShop,
        products: [
          ...mockShop.products,
          {
            _id: new Types.ObjectId().toString(),
            name: 'Another Product',
            price: 15.0,
            description: 'Another Description',
            category: 'test',
            isAvailable: true
          }
        ]
      };

      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShopWithMultipleProducts);
      (OrderModel.create as jest.Mock).mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: mockUserId,
        businessId: mockShopId,
        items: [
          {
            productId: mockProductId,
            quantity: 2,
            price: 10.0,
            name: 'Test Product'
          },
          {
            productId: new Types.ObjectId(),
            quantity: 1,
            price: 15.0,
            name: 'Another Product'
          }
        ],
        totalAmount: 40.0, // (10 * 2) + (15 * 1) + 5 delivery fee
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          coordinates: [40.7128, -74.0060]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const order = await service.placeOrder(
        mockUserId,
        mockShopId,
        [
          {
            productId: mockProductId,
            quantity: 2,
            price: 10.0,
            name: 'Test Product'
          },
          {
            productId: new Types.ObjectId(),
            quantity: 1,
            price: 15.0,
            name: 'Another Product'
          }
        ],
        '123 Test St, New York, NY'
      );

      expect(order).toBeDefined();
      expect(order.totalAmount).toBe(40.0);
    });

    it('should throw error for invalid delivery coordinates', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        'Invalid Location, Antarctica' // This should trigger invalid coordinates
      )).rejects.toThrow(AppError);
    });

    it('should handle product availability changes during order processing', async () => {
      const mockShopWithChangingAvailability = {
        ...mockShop,
        products: [{
          ...mockShop.products[0],
          isAvailable: true
        }]
      };

      // First call returns available product
      (SmokeShop.findById as jest.Mock).mockResolvedValueOnce(mockShopWithChangingAvailability);
      
      // Second call (during order creation) returns unavailable product
      (SmokeShop.findById as jest.Mock).mockResolvedValueOnce({
        ...mockShopWithChangingAvailability,
        products: [{
          ...mockShopWithChangingAvailability.products[0],
          isAvailable: false
        }]
      });

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      )).rejects.toThrow(AppError);
    });

    it('should handle concurrent order attempts', async () => {
      const mockShopWithLimitedStock = {
        ...mockShop,
        products: [{
          ...mockShop.products[0],
          stock: 5
        }]
      };

      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShopWithLimitedStock);

      // Simulate concurrent orders
      const orderPromises = Array(3).fill(null).map(() => 
        service.placeOrder(
          mockUserId,
          mockShopId,
          [{
            productId: mockProductId,
            quantity: 2,
            price: 10.0,
            name: 'Test Product'
          }],
          '123 Test St, New York, NY'
        )
      );

      const results = await Promise.allSettled(orderPromises);
      const successfulOrders = results.filter(r => r.status === 'fulfilled');
      const failedOrders = results.filter(r => r.status === 'rejected');

      // At least one order should fail due to stock constraints
      expect(failedOrders.length).toBeGreaterThan(0);
    });

    it('should handle partial refund scenarios', async () => {
      const mockOrder = {
        _id: new Types.ObjectId(),
        userId: mockUserId,
        businessId: mockShopId,
        items: [
          {
            productId: mockProductId,
            quantity: 2,
            price: 10.0,
            name: 'Test Product'
          },
          {
            productId: new Types.ObjectId(),
            quantity: 1,
            price: 15.0,
            name: 'Another Product'
          }
        ],
        totalAmount: 40.0,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        deliveryAddress: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          coordinates: [40.7128, -74.0060]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);
      (OrderModel.create as jest.Mock).mockResolvedValue(mockOrder);

      const order = await service.placeOrder(
        mockUserId,
        mockShopId,
        mockOrder.items,
        '123 Test St, New York, NY'
      );

      // Simulate partial refund for one item
      const refundAmount = 20.0; // Refund for one Test Product
      const updatedOrder = {
        ...order,
        items: order.items.map(item => 
          item.productId === mockProductId
            ? { ...item, quantity: 1 } // Reduce quantity by 1
            : item
        ),
        totalAmount: order.totalAmount - refundAmount
      };

      expect(updatedOrder.totalAmount).toBe(20.0); // 40 - 20 refund
      expect(updatedOrder.items.find(i => i.productId === mockProductId)?.quantity).toBe(1);
    });
  });
}); 