import { Request, Response } from 'express';
import { AppError, ValidationError, DatabaseError, NotFoundError } from '../utils/errorHandler';
import { logger, performanceLogger } from '../utils/logger';
import { IFoodOrder, IFoodOrderResponse } from '../types/foodOrder';
import { FoodDeliveryService } from '../services/foodDelivery.service';

export class FoodDeliveryController {
  private static instance: FoodDeliveryController;
  private foodOrderService: FoodDeliveryService;

  private constructor() {
    this.foodOrderService = FoodDeliveryService.getInstance();
  }

  public static getInstance(): FoodDeliveryController {
    if (!FoodDeliveryController.instance) {
      FoodDeliveryController.instance = new FoodDeliveryController();
    }
    return FoodDeliveryController.instance;
  }

  public async createOrder(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const orderData: IFoodOrder = req.body;
      
      // Validate order data
      if (!orderData.restaurantId || !orderData.items || !orderData.deliveryAddress) {
        throw new ValidationError('Invalid order data', {
          context: { orderData },
          fingerprint: ['food-delivery', 'create-order', 'validation']
        });
      }

      const order = await this.foodOrderService.createOrder(orderData);
      
      const response: IFoodOrderResponse = {
        success: true,
        data: order,
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
      
      performanceLogger.info('createOrder', {
        duration: performance.now() - startTime,
        orderId: order.id
      });
    } catch (error) {
      logger.error('Error creating food order', {
        error,
        context: { body: req.body }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to create food order', {
        context: { body: req.body },
        fingerprint: ['food-delivery', 'create-order', 'database']
      });
    }
  }

  public async getOrderById(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError('Invalid order ID', {
          context: { id },
          fingerprint: ['food-delivery', 'get-order', 'validation']
        });
      }

      const order = await this.foodOrderService.getOrderById(id);
      
      if (!order) {
        throw new NotFoundError('Food order not found', {
          context: { id },
          fingerprint: ['food-delivery', 'get-order', 'not-found']
        });
      }

      const response: IFoodOrderResponse = {
        success: true,
        data: order,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
      performanceLogger.info('getOrderById', {
        duration: performance.now() - startTime,
        orderId: id
      });
    } catch (error) {
      logger.error('Error fetching food order', {
        error,
        context: { params: req.params }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch food order', {
        context: { params: req.params },
        fingerprint: ['food-delivery', 'get-order', 'database']
      });
    }
  }

  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id) {
        throw new ValidationError('Invalid order ID', {
          context: { id },
          fingerprint: ['food-delivery', 'update-status', 'validation']
        });
      }

      if (!status) {
        throw new ValidationError('Status is required', {
          context: { status },
          fingerprint: ['food-delivery', 'update-status', 'validation']
        });
      }

      const order = await this.foodOrderService.updateOrderStatus(id, status);
      
      if (!order) {
        throw new NotFoundError('Food order not found', {
          context: { id },
          fingerprint: ['food-delivery', 'update-status', 'not-found']
        });
      }

      const response: IFoodOrderResponse = {
        success: true,
        data: order,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
      performanceLogger.info('updateOrderStatus', {
        duration: performance.now() - startTime,
        orderId: id,
        status
      });
    } catch (error) {
      logger.error('Error updating food order status', {
        error,
        context: { params: req.params, body: req.body }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to update food order status', {
        context: { params: req.params, body: req.body },
        fingerprint: ['food-delivery', 'update-status', 'database']
      });
    }
  }

  public async getRestaurantMenu(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const { restaurantId } = req.params;
      
      if (!restaurantId) {
        throw new ValidationError('Invalid restaurant ID', {
          context: { restaurantId },
          fingerprint: ['food-delivery', 'get-menu', 'validation']
        });
      }

      const menu = await this.foodOrderService.getRestaurantMenu(restaurantId);
      
      if (!menu) {
        throw new NotFoundError('Restaurant menu not found', {
          context: { restaurantId },
          fingerprint: ['food-delivery', 'get-menu', 'not-found']
        });
      }

      const response = {
        success: true,
        data: menu,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
      performanceLogger.info('getRestaurantMenu', {
        duration: performance.now() - startTime,
        restaurantId
      });
    } catch (error) {
      logger.error('Error fetching restaurant menu', {
        error,
        context: { params: req.params }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch restaurant menu', {
        context: { params: req.params },
        fingerprint: ['food-delivery', 'get-menu', 'database']
      });
    }
  }

  public async assignDriver(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const { orderId } = req.params;
      const { driverId } = req.body;
      
      if (!orderId) {
        throw new ValidationError('Invalid order ID', {
          context: { orderId },
          fingerprint: ['food-delivery', 'assign-driver', 'validation']
        });
      }

      if (!driverId) {
        throw new ValidationError('Invalid driver ID', {
          context: { driverId },
          fingerprint: ['food-delivery', 'assign-driver', 'validation']
        });
      }

      const order = await this.foodOrderService.assignDriver(orderId, driverId);
      
      if (!order) {
        throw new NotFoundError('Food order not found', {
          context: { orderId },
          fingerprint: ['food-delivery', 'assign-driver', 'not-found']
        });
      }

      const response: IFoodOrderResponse = {
        success: true,
        data: order,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(response);
      
      performanceLogger.info('assignDriver', {
        duration: performance.now() - startTime,
        orderId,
        driverId
      });
    } catch (error) {
      logger.error('Error assigning driver to food order', {
        error,
        context: { params: req.params, body: req.body }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      throw new DatabaseError('Failed to assign driver to food order', {
        context: { params: req.params, body: req.body },
        fingerprint: ['food-delivery', 'assign-driver', 'database']
      });
    }
  }
} 