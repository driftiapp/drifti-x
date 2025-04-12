import { IFoodOrder, OrderStatus, IRestaurantMenu } from '../types/foodOrder';
import { AppError, DatabaseError, ValidationError } from '../utils/errorHandler';
import { performanceLogger } from '../utils/logger';

export class FoodDeliveryService {
  private static instance: FoodDeliveryService;

  private constructor() {}

  public static getInstance(): FoodDeliveryService {
    if (!FoodDeliveryService.instance) {
      FoodDeliveryService.instance = new FoodDeliveryService();
    }
    return FoodDeliveryService.instance;
  }

  public async createOrder(orderData: Omit<IFoodOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IFoodOrder> {
    const startTime = performance.now();
    try {
      // Validate order data
      if (!orderData.customerId || !orderData.restaurantId || !orderData.items.length) {
        throw new ValidationError('Invalid order data', {
          context: { orderData },
          fingerprint: ['food-delivery', 'create-order', 'validation']
        });
      }

      // Calculate total amount
      const totalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      const order: IFoodOrder = {
        ...orderData,
        id: Math.random().toString(36).substr(2, 9),
        status: OrderStatus.PENDING,
        totalAmount,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      performanceLogger.info('createOrder', {
        duration: performance.now() - startTime,
        orderId: order.id
      });

      return order;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      throw new DatabaseError('Failed to create order', {
        context: { 
          orderData,
          error: {
            message: err.message,
            name: err.name,
            stack: err.stack
          }
        },
        fingerprint: ['food-delivery', 'create-order', 'database']
      });
    }
  }

  public async getOrderById(id: string): Promise<IFoodOrder> {
    const startTime = performance.now();
    try {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      const order: IFoodOrder = {
        id,
        customerId: 'customer123',
        restaurantId: 'restaurant456',
        items: [{
          menuItemId: 'item789',
          quantity: 2,
          price: 10.99
        }],
        status: OrderStatus.PENDING,
        totalAmount: 21.98,
        deliveryAddress: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          coordinates: [37.7749, -122.4194]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      performanceLogger.info('getOrderById', {
        duration: performance.now() - startTime,
        orderId: id
      });

      return order;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      throw new DatabaseError('Failed to fetch order', {
        context: { 
          orderId: id,
          error: {
            message: err.message,
            name: err.name,
            stack: err.stack
          }
        },
        fingerprint: ['food-delivery', 'get-order', 'database']
      });
    }
  }

  public async updateOrderStatus(id: string, status: OrderStatus): Promise<IFoodOrder> {
    const startTime = performance.now();
    try {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      const order = await this.getOrderById(id);
      order.status = status;
      order.updatedAt = new Date();

      performanceLogger.info('updateOrderStatus', {
        duration: performance.now() - startTime,
        orderId: id,
        status
      });

      return order;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      throw new DatabaseError('Failed to update order status', {
        context: { 
          orderId: id, 
          status,
          error: {
            message: err.message,
            name: err.name,
            stack: err.stack
          }
        },
        fingerprint: ['food-delivery', 'update-status', 'database']
      });
    }
  }

  public async getRestaurantMenu(restaurantId: string): Promise<IRestaurantMenu> {
    const startTime = performance.now();
    try {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      const menu: IRestaurantMenu = {
        id: 'menu123',
        restaurantId,
        items: [{
          id: 'item1',
          name: 'Burger',
          description: 'Delicious burger',
          price: 10.99,
          category: 'Main Course',
          isAvailable: true
        }],
        categories: ['Main Course', 'Appetizers', 'Desserts'],
        lastUpdated: new Date()
      };

      performanceLogger.info('getRestaurantMenu', {
        duration: performance.now() - startTime,
        restaurantId
      });

      return menu;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      throw new DatabaseError('Failed to fetch restaurant menu', {
        context: { 
          restaurantId,
          error: {
            message: err.message,
            name: err.name,
            stack: err.stack
          }
        },
        fingerprint: ['food-delivery', 'get-menu', 'database']
      });
    }
  }

  public async assignDriver(orderId: string, driverId: string): Promise<IFoodOrder> {
    const startTime = performance.now();
    try {
      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      const order = await this.getOrderById(orderId);
      order.assignedDriverId = driverId;
      order.updatedAt = new Date();

      performanceLogger.info('assignDriver', {
        duration: performance.now() - startTime,
        orderId,
        driverId
      });

      return order;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const err = error as Error;
      throw new DatabaseError('Failed to assign driver', {
        context: { 
          orderId, 
          driverId,
          error: {
            message: err.message,
            name: err.name,
            stack: err.stack
          }
        },
        fingerprint: ['food-delivery', 'assign-driver', 'database']
      });
    }
  }
} 