import { Types } from 'mongoose';
import { AppError, ErrorCode } from '../utils/AppError';
import { logger, withPerformanceLogging } from '../utils/logger';
import { ILiquorOrder } from '../types/liquorDelivery';
import { OrderModel } from '../models/order.model';
import { OrderStatus, PaymentStatus } from '../types/order';

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
   * @returns {Promise<ILiquorOrder>} The created order
   * @throws {AppError} If the order creation fails
   */
  public async createOrder(
    orderData: Omit<ILiquorOrder, '_id' | 'customer' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'>
  ): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.createOrder', async () => {
      try {
        logger.info('Creating new liquor delivery order', { orderData });
        const order = new OrderModel({
          ...orderData,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        });
        await order.save();
        logger.info('Successfully created liquor delivery order', { orderId: order._id });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error creating liquor delivery order:', error);
        throw new AppError('Failed to create order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get all orders for a specific user
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder[]>} The user's orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  public async getUserOrders(userId: Types.ObjectId): Promise<ILiquorOrder[]> {
    return withPerformanceLogging('LiquorDeliveryService.getUserOrders', async () => {
      try {
        logger.info('Getting user liquor delivery orders', { userId });
        const orders = await OrderModel.find({ customer: userId }).sort({ createdAt: -1 });
        logger.info('Successfully retrieved user liquor delivery orders', { userId, count: orders.length });
        return orders.map(order => order.toObject() as unknown as ILiquorOrder);
      } catch (error) {
        logger.error('Error getting user liquor delivery orders:', error);
        throw new AppError('Failed to get user orders', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get an order by its ID
   * @param {string} orderId - The order ID
   * @returns {Promise<ILiquorOrder>} The order
   * @throws {AppError} If the order is not found or cannot be retrieved
   */
  public async getOrderById(orderId: string): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.getOrderById', async () => {
      try {
        logger.info('Getting liquor delivery order details', { orderId });
        const order = await OrderModel.findById(orderId);
        if (!order) {
          logger.warn('Liquor delivery order not found', { orderId });
          throw new AppError('Order not found', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully retrieved liquor delivery order details', { orderId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error getting liquor delivery order details:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to get order details', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Cancel an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} userId - The user ID
   * @returns {Promise<ILiquorOrder>} The cancelled order
   * @throws {AppError} If the order cannot be cancelled
   */
  public async cancelOrder(orderId: string, userId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.cancelOrder', async () => {
      try {
        logger.info('Canceling liquor delivery order', { orderId, userId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, customer: userId, status: OrderStatus.PENDING },
          { status: OrderStatus.CANCELLED },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be cancelled', { orderId, userId });
          throw new AppError('Order not found or cannot be cancelled', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully cancelled liquor delivery order', { orderId, userId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error canceling liquor delivery order:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to cancel order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get all orders for a specific store
   * @param {Types.ObjectId} storeId - The store ID
   * @returns {Promise<ILiquorOrder[]>} The store's orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  public async getStoreOrders(storeId: Types.ObjectId): Promise<ILiquorOrder[]> {
    return withPerformanceLogging('LiquorDeliveryService.getStoreOrders', async () => {
      try {
        logger.info('Getting store liquor delivery orders', { storeId });
        const orders = await OrderModel.find({ store: storeId }).sort({ createdAt: -1 });
        logger.info('Successfully retrieved store liquor delivery orders', { storeId, count: orders.length });
        return orders.map(order => order.toObject() as unknown as ILiquorOrder);
      } catch (error) {
        logger.error('Error getting store liquor delivery orders:', error);
        throw new AppError('Failed to get store orders', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Accept an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} storeId - The store ID
   * @returns {Promise<ILiquorOrder>} The accepted order
   * @throws {AppError} If the order cannot be accepted
   */
  public async acceptOrder(orderId: string, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.acceptOrder', async () => {
      try {
        logger.info('Accepting liquor delivery order', { orderId, storeId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, store: storeId, status: OrderStatus.PENDING },
          { status: OrderStatus.CONFIRMED },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be accepted', { orderId, storeId });
          throw new AppError('Order not found or cannot be accepted', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully accepted liquor delivery order', { orderId, storeId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error accepting liquor delivery order:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to accept order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Prepare an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} storeId - The store ID
   * @returns {Promise<ILiquorOrder>} The prepared order
   * @throws {AppError} If the order cannot be prepared
   */
  public async prepareOrder(orderId: string, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.prepareOrder', async () => {
      try {
        logger.info('Preparing liquor delivery order', { orderId, storeId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, store: storeId, status: OrderStatus.CONFIRMED },
          { status: OrderStatus.PREPARING },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be prepared', { orderId, storeId });
          throw new AppError('Order not found or cannot be prepared', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully prepared liquor delivery order', { orderId, storeId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error preparing liquor delivery order:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to prepare order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Mark an order as ready
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} storeId - The store ID
   * @returns {Promise<ILiquorOrder>} The ready order
   * @throws {AppError} If the order cannot be marked as ready
   */
  public async markOrderReady(orderId: string, storeId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.markOrderReady', async () => {
      try {
        logger.info('Marking liquor delivery order as ready', { orderId, storeId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, store: storeId, status: OrderStatus.PREPARING },
          { status: OrderStatus.READY },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be marked as ready', { orderId, storeId });
          throw new AppError('Order not found or cannot be marked as ready', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully marked liquor delivery order as ready', { orderId, storeId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error marking liquor delivery order as ready:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to mark order as ready', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get all available orders
   * @returns {Promise<ILiquorOrder[]>} The available orders
   * @throws {AppError} If the orders cannot be retrieved
   */
  public async getAvailableOrders(): Promise<ILiquorOrder[]> {
    return withPerformanceLogging('LiquorDeliveryService.getAvailableOrders', async () => {
      try {
        logger.info('Getting available liquor delivery orders');
        const orders = await OrderModel.find({ status: OrderStatus.READY }).sort({ createdAt: 1 });
        logger.info('Successfully retrieved available liquor delivery orders', { count: orders.length });
        return orders.map(order => order.toObject() as unknown as ILiquorOrder);
      } catch (error) {
        logger.error('Error getting available liquor delivery orders:', error);
        throw new AppError('Failed to get available orders', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Pick up an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} driverId - The driver ID
   * @returns {Promise<ILiquorOrder>} The picked up order
   * @throws {AppError} If the order cannot be picked up
   */
  public async pickupOrder(orderId: string, driverId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.pickupOrder', async () => {
      try {
        logger.info('Picking up liquor delivery order', { orderId, driverId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, status: OrderStatus.READY },
          { status: OrderStatus.DELIVERING, driver: driverId },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be picked up', { orderId, driverId });
          throw new AppError('Order not found or cannot be picked up', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully picked up liquor delivery order', { orderId, driverId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error picking up liquor delivery order:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to pick up order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Deliver an order
   * @param {string} orderId - The order ID
   * @param {Types.ObjectId} driverId - The driver ID
   * @returns {Promise<ILiquorOrder>} The delivered order
   * @throws {AppError} If the order cannot be delivered
   */
  public async deliverOrder(orderId: string, driverId: Types.ObjectId): Promise<ILiquorOrder> {
    return withPerformanceLogging('LiquorDeliveryService.deliverOrder', async () => {
      try {
        logger.info('Delivering liquor delivery order', { orderId, driverId });
        const order = await OrderModel.findOneAndUpdate(
          { _id: orderId, driver: driverId, status: OrderStatus.DELIVERING },
          { status: OrderStatus.COMPLETED },
          { new: true }
        );
        if (!order) {
          logger.warn('Liquor delivery order not found or cannot be delivered', { orderId, driverId });
          throw new AppError('Order not found or cannot be delivered', 404, {
            code: ErrorCode.NOT_FOUND
          });
        }
        logger.info('Successfully delivered liquor delivery order', { orderId, driverId });
        return order.toObject() as unknown as ILiquorOrder;
      } catch (error) {
        logger.error('Error delivering liquor delivery order:', error);
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to deliver order', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get driver earnings
   * @param {Types.ObjectId} driverId - The driver ID
   * @returns {Promise<{ totalEarnings: number; completedDeliveries: number }>} The driver's earnings
   * @throws {AppError} If the earnings cannot be retrieved
   */
  public async getDriverEarnings(
    driverId: Types.ObjectId
  ): Promise<{ totalEarnings: number; completedDeliveries: number }> {
    return withPerformanceLogging('LiquorDeliveryService.getDriverEarnings', async () => {
      try {
        logger.info('Getting driver earnings', { driverId });
        const orders = await OrderModel.find({
          driver: driverId,
          status: OrderStatus.COMPLETED
        });
        const totalEarnings = orders.reduce((total, order) => total + order.deliveryFee, 0);
        const completedDeliveries = orders.length;
        logger.info('Successfully retrieved driver earnings', { driverId, totalEarnings, completedDeliveries });
        return { totalEarnings, completedDeliveries };
      } catch (error) {
        logger.error('Error getting driver earnings:', error);
        throw new AppError('Failed to get driver earnings', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }
} 