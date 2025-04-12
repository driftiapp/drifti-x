import { AppError, ValidationError } from '../utils/errorHandler';
import { logger, withPerformanceLogging } from '../utils/logger';
import * as Sentry from '@sentry/node';
import { 
  IOrder, 
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  orderSchema
} from '../types/order';
import { IOrderRepository, OrderRepository } from '../repositories/order.repository';
import { OrderModel } from '../models/order.model';

class OrderService {
  private static instance: OrderService;
  private repository: IOrderRepository;

  private constructor(repository: IOrderRepository) {
    this.repository = repository;
  }

  public static getInstance(repository: IOrderRepository): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService(repository);
    }
    return OrderService.instance;
  }

  public async createOrder(data: Partial<IOrder>): Promise<IOrder> {
    return withPerformanceLogging('createOrder', async () => {
      try {
        logger.info('Creating order', { data });

        // Validate order data
        try {
          orderSchema.parse(data);
        } catch (validationError) {
          throw new ValidationError('Invalid order data', {
            context: {
              validationError,
              data
            },
            fingerprint: ['order-validation']
          });
        }

        const order = await this.repository.create({
          userId: data.userId || 'default-user',
          items: data.items || [],
          totalAmount: data.totalAmount || 0,
          status: data.status || OrderStatus.PENDING,
          paymentStatus: data.paymentStatus || PaymentStatus.PENDING,
          paymentMethod: data.paymentMethod || PaymentMethod.CREDIT_CARD,
          shippingAddress: data.shippingAddress || {
            street: 'Default Street',
            city: 'Default City',
            state: 'Default State',
            country: 'Default Country',
            zipCode: '00000'
          },
          billingAddress: data.billingAddress,
          trackingNumber: data.trackingNumber,
          estimatedDelivery: data.estimatedDelivery,
          notes: data.notes,
          metadata: data.metadata
        });

        logger.info('Order created successfully', { order });
        return order;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async getOrders(filters: {
    userId?: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    startDate?: Date;
    endDate?: Date;
  }): Promise<IOrder[]> {
    return withPerformanceLogging('getOrders', async () => {
      try {
        logger.info('Fetching orders', { filters });
        const orders = await this.repository.findByFilters(filters);
        logger.info('Orders fetched successfully', { count: orders.length });
        return orders;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async getOrderById(id: string): Promise<IOrder> {
    return withPerformanceLogging('getOrderById', async () => {
      try {
        logger.info('Fetching order by ID', { id });
        const order = await this.repository.findById(id);
        logger.info('Order fetched successfully', { id });
        return order;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async updateOrderStatus(id: string, status: OrderStatus): Promise<IOrder> {
    return withPerformanceLogging('updateOrderStatus', async () => {
      try {
        logger.info('Updating order status', { id, status });
        const order = await this.repository.updateStatus(id, status);
        logger.info('Order status updated successfully', { id, status });
        return order;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<IOrder> {
    return withPerformanceLogging('updatePaymentStatus', async () => {
      try {
        logger.info('Updating payment status', { id, paymentStatus });
        const order = await this.repository.updatePaymentStatus(id, paymentStatus);
        logger.info('Payment status updated successfully', { id, paymentStatus });
        return order;
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async deleteOrder(id: string): Promise<void> {
    return withPerformanceLogging('deleteOrder', async () => {
      try {
        logger.info('Deleting order', { id });
        await this.repository.delete(id);
        logger.info('Order deleted successfully', { id });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async processPayment(orderId: string, paymentDetails: {
    amount: number;
    method: PaymentMethod;
    transactionId: string;
  }): Promise<IOrder> {
    return withPerformanceLogging('processPayment', async () => {
      try {
        logger.info('Processing payment', { orderId, paymentDetails });

        const order = await this.repository.findById(orderId);
        if (!order) {
          throw new ValidationError('Order not found', {
            context: { orderId },
            fingerprint: ['order-payment-validation']
          });
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
          throw new ValidationError('Order already paid', {
            context: { orderId },
            fingerprint: ['order-payment-validation']
          });
        }

        // Simulate payment processing
        const paymentSuccessful = true; // Replace with actual payment processing logic

        if (paymentSuccessful) {
          const updatedOrder = await this.repository.updatePaymentStatus(
            orderId,
            PaymentStatus.PAID
          );

          logger.info('Payment processed successfully', { orderId });
          return updatedOrder;
        } else {
          throw new ValidationError('Payment failed', {
            context: { orderId, paymentDetails },
            fingerprint: ['order-payment-failure']
          });
        }
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }
}

export const orderService = OrderService.getInstance(
  OrderRepository.getInstance(OrderModel)
); 