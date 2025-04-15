import { Request, Response } from 'express';
import { SmokeShopService } from '../services/smokeShop.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { withPerformanceLogging } from '../utils/logger';
import { IController } from '../types/controller';
import { ISmokeShopProduct, ISmokeShopOrder } from '../types/smokeShop';
import { ErrorCode, ErrorType } from '../types/error';

/**
 * Controller for handling smoke shop operations
 */
export class SmokeShopController implements IController {
  private static instance: SmokeShopController;
  private service: SmokeShopService;

  private constructor() {
    this.service = SmokeShopService.getInstance();
  }

  public static getInstance(): SmokeShopController {
    if (!SmokeShopController.instance) {
      SmokeShopController.instance = new SmokeShopController();
    }
    return SmokeShopController.instance;
  }

  @withPerformanceLogging
  public async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await this.service.getProducts();
      res.json(products);
    } catch (error) {
      logger.error('Error getting products:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get products', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.service.getProductById(req.params.id);
      if (!product) {
        throw new AppError('Product not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.json(product);
    } catch (error) {
      logger.error('Error getting product:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get product', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.service.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      logger.error('Error creating product:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create product', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.service.updateProduct(req.params.id, req.body);
      if (!product) {
        throw new AppError('Product not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.json(product);
    } catch (error) {
      logger.error('Error updating product:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update product', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.deleteProduct(req.params.id);
      if (!result) {
        throw new AppError('Product not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting product:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete product', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await this.service.getOrders();
      res.json(orders);
    } catch (error) {
      logger.error('Error getting orders:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get orders', ErrorCode.ORDER_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.service.getOrderById(req.params.id);
      if (!order) {
        throw new AppError('Order not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.json(order);
    } catch (error) {
      logger.error('Error getting order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get order', ErrorCode.ORDER_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.service.createOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      logger.error('Error creating order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create order', ErrorCode.ORDER_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.service.updateOrder(req.params.id, req.body);
      if (!order) {
        throw new AppError('Order not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.json(order);
    } catch (error) {
      logger.error('Error updating order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update order', ErrorCode.ORDER_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.deleteOrder(req.params.id);
      if (!result) {
        throw new AppError('Order not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete order', ErrorCode.ORDER_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.service.getCategories();
      res.json(categories);
    } catch (error) {
      logger.error('Error getting categories:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get categories', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.service.createCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      logger.error('Error creating category:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create category', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = await this.service.updateCategory(req.params.id, req.body);
      if (!category) {
        throw new AppError('Category not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.json(category);
    } catch (error) {
      logger.error('Error updating category:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update category', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }

  @withPerformanceLogging
  public async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.service.deleteCategory(req.params.id);
      if (!result) {
        throw new AppError('Category not found', ErrorCode.NOT_FOUND, {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date()
        });
      }
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting category:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete category', ErrorCode.PRODUCT_ERROR, {
        errorType: ErrorType.TECHNICAL,
        timestamp: new Date()
      });
    }
  }
} 