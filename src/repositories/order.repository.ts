import { AppError, DatabaseError, NotFoundError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';
import { 
  IOrder, 
  OrderStatus,
  PaymentStatus,
  PaymentMethod
} from '../types/order';
import { Model } from 'mongoose';

export interface IOrderRepository {
  create(order: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IOrder>;
  findById(id: string): Promise<IOrder>;
  findByUserId(userId: string): Promise<IOrder[]>;
  findByFilters(filters: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IOrder[]>;
  updateStatus(id: string, status: OrderStatus): Promise<IOrder>;
  updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<IOrder>;
  delete(id: string): Promise<void>;
}

export class OrderRepository implements IOrderRepository {
  private static instance: OrderRepository;
  private orderModel: Model<IOrder>;

  private constructor(orderModel: Model<IOrder>) {
    this.orderModel = orderModel;
  }

  public static getInstance(orderModel: Model<IOrder>): OrderRepository {
    if (!OrderRepository.instance) {
      OrderRepository.instance = new OrderRepository(orderModel);
    }
    return OrderRepository.instance;
  }

  public async create(order: Omit<IOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<IOrder> {
    try {
      logger.info('Creating order in repository', { order });
      
      const createdOrder = await this.orderModel.create(order);

      logger.info('Order created successfully in repository', { id: createdOrder.id });
      return createdOrder.toObject();
    } catch (error) {
      logger.error('Failed to create order in repository', { error });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to create order', {
        context: {
          originalError: error,
          order
        },
        fingerprint: ['order-repository-create']
      });
    }
  }

  public async findById(id: string): Promise<IOrder> {
    try {
      logger.info('Finding order by ID', { id });
      
      const order = await this.orderModel.findById(id).lean();
      if (!order) {
        throw new NotFoundError('Order not found', {
          context: { id },
          fingerprint: ['order-repository-find']
        });
      }

      logger.info('Order found successfully', { id });
      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to find order', { error, id });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find order', {
        context: {
          originalError: error,
          id
        },
        fingerprint: ['order-repository-find']
      });
    }
  }

  public async findByUserId(userId: string): Promise<IOrder[]> {
    try {
      logger.info('Finding orders by user ID', { userId });
      
      const orders = await this.orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      logger.info('Orders found successfully', { count: orders.length });
      return orders;
    } catch (error) {
      logger.error('Failed to find orders by user ID', { error, userId });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find orders by user ID', {
        context: {
          originalError: error,
          userId
        },
        fingerprint: ['order-repository-find-user']
      });
    }
  }

  public async findByFilters(filters: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IOrder[]> {
    try {
      logger.info('Finding orders by filters', { filters });
      
      const query: any = {};
      if (filters.userId) query.userId = filters.userId;
      if (filters.status) query.status = filters.status;
      if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
      if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      const orders = await this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean();

      logger.info('Orders found successfully by filters', { count: orders.length });
      return orders;
    } catch (error) {
      logger.error('Failed to find orders by filters', { error, filters });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find orders by filters', {
        context: {
          originalError: error,
          filters
        },
        fingerprint: ['order-repository-find-filters']
      });
    }
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<IOrder> {
    try {
      logger.info('Updating order status', { id, status });
      
      const order = await this.orderModel
        .findByIdAndUpdate(
          id,
          { status },
          { new: true }
        )
        .lean();

      if (!order) {
        throw new NotFoundError('Order not found', {
          context: { id },
          fingerprint: ['order-repository-update-status']
        });
      }

      logger.info('Order status updated successfully', { id, status });
      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to update order status', { error, id, status });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to update order status', {
        context: {
          originalError: error,
          id,
          status
        },
        fingerprint: ['order-repository-update-status']
      });
    }
  }

  public async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<IOrder> {
    try {
      logger.info('Updating order payment status', { id, paymentStatus });
      
      const order = await this.orderModel
        .findByIdAndUpdate(
          id,
          { paymentStatus },
          { new: true }
        )
        .lean();

      if (!order) {
        throw new NotFoundError('Order not found', {
          context: { id },
          fingerprint: ['order-repository-update-payment']
        });
      }

      logger.info('Order payment status updated successfully', { id, paymentStatus });
      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to update order payment status', { error, id, paymentStatus });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to update order payment status', {
        context: {
          originalError: error,
          id,
          paymentStatus
        },
        fingerprint: ['order-repository-update-payment']
      });
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting order', { id });
      
      const result = await this.orderModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('Order not found', {
          context: { id },
          fingerprint: ['order-repository-delete']
        });
      }

      logger.info('Order deleted successfully', { id });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to delete order', { error, id });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to delete order', {
        context: {
          originalError: error,
          id
        },
        fingerprint: ['order-repository-delete']
      });
    }
  }
} 