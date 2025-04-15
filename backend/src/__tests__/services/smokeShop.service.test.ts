import { Types } from 'mongoose';
import { SmokeShopService } from '../../services/smokeShop.service';
import { SmokeShop } from '../../models/smokeShop.model';
import { OrderModel } from '../../models/order.model';
import { AppError, ErrorCode } from '../../utils/AppError';
import { ISmokeShop } from '../../types/smokeShop';
import { IOrder, IOrderItem, OrderStatus, PaymentStatus, PaymentMethod } from '../../types/order';
import { IUser, UserRole } from '../../types/user';

jest.mock('../../models/smokeShop.model');
jest.mock('../../models/order.model');
jest.mock('../../utils/deliveryUtils', () => ({
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
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
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
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
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
      )).rejects.toThrow(new AppError('Shop not found', ErrorCode.NOT_FOUND));
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
      )).rejects.toThrow(new AppError('Product not found in shop', ErrorCode.NOT_FOUND));
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
      expect(order.items.length).toBe(2);
    });

    it('should throw error if product is not available', async () => {
      const mockShopWithUnavailableProduct = {
        ...mockShop,
        products: [{
          ...mockShop.products[0],
          isAvailable: false
        }]
      };

      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShopWithUnavailableProduct);

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
      )).rejects.toThrow(new AppError('Product is not available', ErrorCode.INVALID_INPUT));
    });

    it('should throw error if quantity is invalid', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 0,
          price: 10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      )).rejects.toThrow(new AppError('Invalid quantity', ErrorCode.INVALID_INPUT));
    });

    it('should throw error if price is invalid', async () => {
      (SmokeShop.findById as jest.Mock).mockResolvedValue(mockShop);

      await expect(service.placeOrder(
        mockUserId,
        mockShopId,
        [{
          productId: mockProductId,
          quantity: 2,
          price: -10.0,
          name: 'Test Product'
        }],
        '123 Test St, New York, NY'
      )).rejects.toThrow(new AppError('Invalid price', ErrorCode.INVALID_INPUT));
    });

    it('should throw error if delivery address is invalid', async () => {
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
        ''
      )).rejects.toThrow(new AppError('Invalid delivery address', ErrorCode.INVALID_INPUT));
    });
  });
}); 