import { Request, Response } from 'express';
import { AppError } from '../utils/errorHandler';
import { logger, withPerformanceLogging } from '../utils/logger';
import * as Sentry from '@sentry/node';
import { 
  IOrderResponse,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  orderResponseSchema
} from '../types/order';
import { requireRole } from '../middleware/auth.middleware';
import { orderService } from '../services/order.service';

class OrderController {
  private static instance: OrderController;

  private constructor() {}

  public static getInstance(): OrderController {
    if (!OrderController.instance) {
      OrderController.instance = new OrderController();
    }
    return OrderController.instance;
  }

  public async createOrder(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('createOrder', async () => {
      try {
        logger.info('Creating new order', { body: req.body });

        const order = await orderService.createOrder(req.body);

        const response: IOrderResponse = {
          success: true,
          data: order,
          timestamp: new Date().toISOString()
        };

        logger.info('Order created successfully', { order });
        res.status(201).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async getOrders(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('getOrders', async () => {
      try {
        const { userId, status, paymentStatus, paymentMethod, startDate, endDate } = req.query;
        logger.info('Fetching orders', { query: req.query });

        const orders = await orderService.getOrders({
          userId: userId as string,
          status: status as OrderStatus,
          paymentStatus: paymentStatus as PaymentStatus,
          paymentMethod: paymentMethod as PaymentMethod,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined
        });

        const response: IOrderResponse = {
          success: true,
          data: orders[0], // Assuming we want to return the first order for now
          timestamp: new Date().toISOString()
        };

        logger.info('Orders fetched successfully', { count: orders.length });
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async getOrderById(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('getOrderById', async () => {
      try {
        const { id } = req.params;
        logger.info('Fetching order by ID', { id });

        const order = await orderService.getOrderById(id);

        const response: IOrderResponse = {
          success: true,
          data: order,
          timestamp: new Date().toISOString()
        };

        logger.info('Order fetched successfully', { id });
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('updateOrderStatus', async () => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        logger.info('Updating order status', { id, status });

        const order = await orderService.updateOrderStatus(id, status);

        const response: IOrderResponse = {
          success: true,
          data: order,
          timestamp: new Date().toISOString()
        };

        logger.info('Order status updated successfully', { id, status });
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async processPayment(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('processPayment', async () => {
      try {
        const { id } = req.params;
        const { amount, method, transactionId } = req.body;
        logger.info('Processing payment', { id, paymentDetails: req.body });

        const order = await orderService.processPayment(id, {
          amount,
          method,
          transactionId
        });

        const response: IOrderResponse = {
          success: true,
          data: order,
          timestamp: new Date().toISOString()
        };

        logger.info('Payment processed successfully', { id });
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }

  public async deleteOrder(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('deleteOrder', async () => {
      try {
        const { id } = req.params;
        logger.info('Deleting order', { id });

        await orderService.deleteOrder(id);

        const response = {
          success: true,
          message: `Order ${id} deleted successfully`,
          timestamp: new Date().toISOString()
        };

        logger.info('Order deleted successfully', { id });
        res.status(200).json(response);
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        throw error;
      }
    });
  }
}

export const orderController = OrderController.getInstance(); 