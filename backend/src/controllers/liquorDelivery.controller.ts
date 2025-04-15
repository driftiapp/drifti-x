import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { LiquorDeliveryService } from '../services/liquorDelivery.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { withPerformanceLogging } from '../utils/performance';
import { ILiquorOrder } from '../types/liquorDelivery';
import { IUser } from '../types/user';
import { IController, ControllerMethod } from '../types/controller';
import { ErrorCode, ErrorType } from '../types/error';

/**
 * Controller for handling liquor delivery operations
 * Implements singleton pattern to ensure single instance
 */
export class LiquorDeliveryController implements IController {
  private static instance: LiquorDeliveryController;
  private service: LiquorDeliveryService;

  private constructor() {
    this.service = LiquorDeliveryService.getInstance();
  }

  /**
   * Get the singleton instance of LiquorDeliveryController
   * @returns LiquorDeliveryController instance
   */
  public static getInstance(): LiquorDeliveryController {
    if (!LiquorDeliveryController.instance) {
      LiquorDeliveryController.instance = new LiquorDeliveryController();
    }
    return LiquorDeliveryController.instance;
  }

  private handleError(error: unknown, res: Response): void {
    logger.error('Error in liquor delivery controller:', error);
    if (error instanceof AppError) {
      res.status(error.code).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new liquor delivery order
   * @param req Express request containing order details
   * @param res Express response
   */
  public createOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.createOrder(
        req.body,
        new Types.ObjectId(req.user._id)
      );
      res.status(201).json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get orders for the current user
   * @param req Express request with authenticated user
   * @param res Express response
   */
  public getMyOrders: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const orders = await this.service.getMyOrders(new Types.ObjectId(req.user._id));
      res.json(orders);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get details of a specific order
   * @param req Express request with order ID
   * @param res Express response
   */
  public getOrderDetails: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.getOrderDetails(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Cancel an existing order
   * @param req Express request with order ID and authenticated user
   * @param res Express response
   */
  public cancelOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.cancelOrder(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get orders for a specific store
   * @param req Express request with authenticated store owner
   * @param res Express response
   */
  public getStoreOrders: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const orders = await this.service.getStoreOrders(new Types.ObjectId(req.user._id));
      res.json(orders);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Accept an order for delivery
   * @param req Express request with order ID and authenticated driver
   * @param res Express response
   */
  public acceptOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.acceptOrder(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Prepare an order for pickup
   * @param req Express request with order ID and authenticated store owner
   * @param res Express response
   */
  public prepareOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.prepareOrder(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Mark an order as ready for pickup
   * @param req Express request with order ID and authenticated store owner
   * @param res Express response
   */
  public markOrderReady: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.markOrderReady(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get available orders for drivers
   * @param req Express request
   * @param res Express response
   */
  public getAvailableOrders: ControllerMethod = async (req, res) => {
    try {
      const orders = await this.service.getAvailableOrders();
      res.json(orders);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Pick up an order for delivery
   * @param req Express request with order ID and authenticated driver
   * @param res Express response
   */
  public pickupOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.pickupOrder(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Mark an order as delivered
   * @param req Express request with order ID and authenticated driver
   * @param res Express response
   */
  public deliverOrder: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const order = await this.service.deliverOrder(
        new Types.ObjectId(req.params.id),
        new Types.ObjectId(req.user._id)
      );
      res.json(order);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get earnings for a driver
   * @param req Express request with authenticated driver
   * @param res Express response
   */
  public getDriverEarnings: ControllerMethod = async (req, res) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', ErrorCode.UNAUTHORIZED, {
          errorType: ErrorType.BUSINESS,
          errorSource: 'auth'
        });
      }
      const earnings = await this.service.getDriverEarnings(new Types.ObjectId(req.user._id));
      res.json(earnings);
    } catch (error) {
      this.handleError(error, res);
    }
  };
} 