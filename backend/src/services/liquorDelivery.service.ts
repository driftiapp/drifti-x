import { Types, Document } from 'mongoose';
import { AppError } from '../utils/AppError';
import { ErrorCode, ErrorType } from '../types/error';
import { logger } from '../utils/logger';
import { withPerformanceLogging } from '../utils/performance';
import { ILiquorOrder, ILiquorOrderCreate, ILiquorOrderUpdate } from '../types/liquorDelivery';
import { OrderModel } from '../models/order.model';
import { OrderStatus, PaymentStatus } from '../types/order';
import { z } from 'zod';
import { IUser } from '../types/user';

/**
 * Zod schema for order data validation
 */
const orderDataSchema = z.object({
  store: z.instanceof(Types.ObjectId),
  items: z.array(z.object({
    product: z.instanceof(Types.ObjectId),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })),
  totalAmount: z.number().min(0),
  deliveryFee: z.number().min(0),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }).optional()
  })
});

/**
 * Service class for handling liquor delivery operations
 * @class LiquorDeliveryService
 */
export class LiquorDeliveryService {
  private static instance: LiquorDeliveryService;

  private constructor() {}

  /**
   * Get the singleton instance of LiquorDeliveryService
   * @returns {LiquorDeliveryService} The singleton instance
   */
  public static getInstance(): LiquorDeliveryService {
    if (!LiquorDeliveryService.instance) {
      LiquorDeliveryService.instance = new LiquorDeliveryService();
    }
    return LiquorDeliveryService.instance;
  }

  /**
   * Create a new liquor delivery order
   * @param {Omit<ILiquorOrder, '_id' | 'customer' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'>} orderData - The order data
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The created order
   * @throws {AppError} If the order creation fails
   */
  @withPerformanceLogging('createOrder')
  public async createOrder(orderData: ILiquorOrderCreate, userId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Creating new order', { userId });
      
      const order = await OrderModel.create({
        ...orderData,
        customer: userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      });

      return order.toObject() as unknown as ILiquorOrder;
    } catch (error) {
      logger.error('Error creating order:', error);
      throw new AppError('Failed to create order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Get all orders for a specific user
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder[]>} The user's orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  @withPerformanceLogging('getMyOrders')
  public async getMyOrders(userId: Types.ObjectId): Promise<ILiquorOrder[]> {
    try {
      logger.info('Fetching user orders', { userId });
      
      const orders = await OrderModel.find({ customer: userId })
        .sort({ createdAt: -1 })
        .lean();
      
      return orders as unknown as ILiquorOrder[];
    } catch (error) {
      logger.error('Error fetching user orders:', error);
      throw new AppError('Failed to fetch orders', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Get an order by its ID
   * @param {string} orderId - The order ID
   * @returns {Promise<ILiquorOrder>} The order
   * @throws {AppError} If the order is not found or cannot be retrieved
   */
  @withPerformanceLogging('getOrderDetails')
  public async getOrderDetails(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Fetching order details', { orderId, userId });
      
      const order = await OrderModel.findOne({
        _id: orderId,
        customer: userId
      }).lean();

      if (!order) {
        throw new AppError('Order not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error fetching order details:', error);
      throw new AppError('Failed to fetch order details', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The cancelled order
   * @throws {AppError} If the order cannot be cancelled
   */
  @withPerformanceLogging('cancelOrder')
  public async cancelOrder(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Cancelling order', { orderId, userId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          customer: userId,
          status: { $in: [OrderStatus.PENDING, OrderStatus.ACCEPTED] }
        },
        { 
          status: OrderStatus.CANCELLED,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be cancelled', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error cancelling order:', error);
      throw new AppError('Failed to cancel order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Get all orders for a specific store
   * @param {Types.ObjectId} storeId - The store ID
   * @returns {Promise<ILiquorOrder[]>} The store's orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  @withPerformanceLogging('getStoreOrders')
  public async getStoreOrders(storeId: Types.ObjectId): Promise<ILiquorOrder[]> {
    try {
      logger.info('Fetching store orders', { storeId });
      
      const orders = await OrderModel.find({ store: storeId })
        .sort({ createdAt: -1 })
        .lean();
      
      return orders as unknown as ILiquorOrder[];
    } catch (error) {
      logger.error('Error fetching store orders:', error);
      throw new AppError('Failed to fetch store orders', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Accept an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The accepted order
   * @throws {AppError} If the order cannot be accepted
   */
  @withPerformanceLogging('acceptOrder')
  public async acceptOrder(orderId: Types.ObjectId, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Accepting order', { orderId, storeId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          store: storeId,
          status: OrderStatus.PENDING
        },
        { 
          status: OrderStatus.ACCEPTED,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be accepted', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error accepting order:', error);
      throw new AppError('Failed to accept order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Prepare an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The prepared order
   * @throws {AppError} If the order cannot be prepared
   */
  @withPerformanceLogging('prepareOrder')
  public async prepareOrder(orderId: Types.ObjectId, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Preparing order', { orderId, storeId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          store: storeId,
          status: OrderStatus.ACCEPTED
        },
        { 
          status: OrderStatus.PREPARING,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be prepared', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error preparing order:', error);
      throw new AppError('Failed to prepare order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Mark an order as ready
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The ready order
   * @throws {AppError} If the order cannot be marked as ready
   */
  @withPerformanceLogging('markOrderReady')
  public async markOrderReady(orderId: Types.ObjectId, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Marking order as ready', { orderId, storeId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          store: storeId,
          status: OrderStatus.PREPARING
        },
        { 
          status: OrderStatus.READY,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be marked as ready', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error marking order as ready:', error);
      throw new AppError('Failed to mark order as ready', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Get available orders for drivers
   * @returns {Promise<ILiquorOrder[]>} The available orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  @withPerformanceLogging('getAvailableOrders')
  public async getAvailableOrders(): Promise<ILiquorOrder[]> {
    try {
      logger.info('Fetching available orders');
      
      const orders = await OrderModel.find({
        status: OrderStatus.READY,
        driver: { $exists: false }
      })
        .sort({ createdAt: -1 })
        .lean();
      
      return orders as unknown as ILiquorOrder[];
    } catch (error) {
      logger.error('Error fetching available orders:', error);
      throw new AppError('Failed to fetch available orders', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Pick up an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The picked up order
   * @throws {AppError} If the order cannot be picked up
   */
  @withPerformanceLogging('pickupOrder')
  public async pickupOrder(orderId: Types.ObjectId, driverId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Picking up order', { orderId, driverId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          status: OrderStatus.READY,
          driver: { $exists: false }
        },
        { 
          driver: driverId,
          status: OrderStatus.IN_TRANSIT,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be picked up', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error picking up order:', error);
      throw new AppError('Failed to pick up order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  /**
   * Deliver an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The delivered order
   * @throws {AppError} If the order cannot be delivered
   */
  @withPerformanceLogging('deliverOrder')
  public async deliverOrder(orderId: Types.ObjectId, driverId: Types.ObjectId): Promise<ILiquorOrder> {
    try {
      logger.info('Delivering order', { orderId, driverId });
      
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          driver: driverId,
          status: OrderStatus.IN_TRANSIT
        },
        { 
          status: OrderStatus.DELIVERED,
          updatedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!order) {
        throw new AppError('Order not found or cannot be delivered', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'order'
        });
      }

      return order as unknown as ILiquorOrder;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error('Error delivering order:', error);
      throw new AppError('Failed to deliver order', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  @withPerformanceLogging('getDriverEarnings')
  public async getDriverEarnings(driverId: Types.ObjectId): Promise<{ totalEarnings: number; completedDeliveries: number }> {
    try {
      logger.info('Calculating driver earnings', { driverId });
      
      const result = await OrderModel.aggregate([
        {
          $match: {
            driver: driverId,
            status: OrderStatus.DELIVERED
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$deliveryFee' },
            completedDeliveries: { $sum: 1 }
          }
        }
      ]);

      if (result.length === 0) {
        return { totalEarnings: 0, completedDeliveries: 0 };
      }

      return {
        totalEarnings: result[0].totalEarnings,
        completedDeliveries: result[0].completedDeliveries
      };
    } catch (error) {
      logger.error('Error calculating driver earnings:', error);
      throw new AppError('Failed to calculate driver earnings', ErrorCode.DATABASE_ERROR, {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'database',
        metadata: { error }
      });
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Error in liquor delivery service:', error);
    throw new AppError(
      'Internal server error',
      ErrorCode.INTERNAL_SERVER_ERROR,
      {
        errorType: ErrorType.TECHNICAL,
        errorSource: 'liquorDeliveryService',
        metadata: { error }
      }
    );
  }
} 