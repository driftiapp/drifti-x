import { Types } from 'mongoose';
import { SmokeShopModel } from '../models/smokeShop.model';
import { OrderModel } from '../models/order.model';
import { AppError, ErrorCode } from '../utils/AppError';
import { ErrorType } from '../types/error';
import { ISmokeShopProduct, ISmokeShopOrder, OrderStatus, ISmokeProduct, ISmokeOrder, ISmokeCategory } from '../types/smokeShop';
import { logger, withPerformanceLogging } from '../utils/logger';

/**
 * Service for handling smoke shop operations
 */
export class SmokeShopService {
  private static instance: SmokeShopService | null = null;
  private model: typeof SmokeShopModel = SmokeShopModel;
  private products: ISmokeProduct[] = [];
  private orders: ISmokeOrder[] = [];
  private categories: ISmokeCategory[] = [];

  public constructor() {
    if (SmokeShopService.instance) {
      return SmokeShopService.instance;
    }
    SmokeShopService.instance = this;
  }

  @withPerformanceLogging('getProducts', 'smokeShop.getProducts')
  public async getProducts(query: any = {}): Promise<ISmokeShopProduct[]> {
    try {
      const products = await this.model.find(query);
      return products;
    } catch (error) {
      throw new AppError(
        'Failed to fetch products',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            timestamp: new Date(),
            context: 'getProducts'
          }
        }
      );
    }
  }

  @withPerformanceLogging('getProductById', 'smokeShop.getProductById')
  public async getProductById(id: string): Promise<ISmokeShopProduct> {
    try {
      const product = await this.model.findById(id);
      if (!product) {
        throw new AppError(
          'Product not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              productId: id,
              timestamp: new Date(),
              context: 'getProductById'
            }
          }
        );
      }
      return product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to fetch product',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            productId: id,
            timestamp: new Date(),
            context: 'getProductById'
          }
        }
      );
    }
  }

  @withPerformanceLogging('createProduct', 'smokeShop.createProduct')
  public async createProduct(data: Partial<ISmokeShopProduct>): Promise<ISmokeShopProduct> {
    try {
      const product = new this.model(data);
      await product.save();
      return product;
    } catch (error) {
      throw new AppError(
        'Failed to create product',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            data,
            timestamp: new Date(),
            context: 'createProduct'
          }
        }
      );
    }
  }

  @withPerformanceLogging('updateProduct', 'smokeShop.updateProduct')
  public async updateProduct(id: string, data: Partial<ISmokeShopProduct>): Promise<ISmokeShopProduct> {
    try {
      const product = await this.model.findByIdAndUpdate(id, data, { new: true });
      if (!product) {
        throw new AppError(
          'Product not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              productId: id,
              timestamp: new Date(),
              context: 'updateProduct'
            }
          }
        );
      }
      return product;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to update product',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            productId: id,
            data,
            timestamp: new Date(),
            context: 'updateProduct'
          }
        }
      );
    }
  }

  @withPerformanceLogging('deleteProduct', 'smokeShop.deleteProduct')
  public async deleteProduct(id: string): Promise<void> {
    try {
      const product = await this.model.findByIdAndDelete(id);
      if (!product) {
        throw new AppError(
          'Product not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              productId: id,
              timestamp: new Date(),
              context: 'deleteProduct'
            }
          }
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to delete product',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            productId: id,
            timestamp: new Date(),
            context: 'deleteProduct'
          }
        }
      );
    }
  }

  @withPerformanceLogging('getOrders', 'smokeShop.getOrders')
  public async getOrders(query: any = {}): Promise<ISmokeShopOrder[]> {
    try {
      const orders = await OrderModel.find(query);
      return orders;
    } catch (error) {
      throw new AppError(
        'Failed to fetch orders',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            timestamp: new Date(),
            context: 'getOrders'
          }
        }
      );
    }
  }

  @withPerformanceLogging('getOrderById', 'smokeShop.getOrderById')
  public async getOrderById(id: string): Promise<ISmokeShopOrder> {
    try {
      const order = await OrderModel.findById(id);
      if (!order) {
        throw new AppError(
          'Order not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              orderId: id,
              timestamp: new Date(),
              context: 'getOrderById'
            }
          }
        );
      }
      return order;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to fetch order',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            orderId: id,
            timestamp: new Date(),
            context: 'getOrderById'
          }
        }
      );
    }
  }

  @withPerformanceLogging('createOrder', 'smokeShop.createOrder')
  public async createOrder(data: Partial<ISmokeShopOrder>): Promise<ISmokeShopOrder> {
    try {
      const order = new OrderModel(data);
      await order.save();
      return order;
    } catch (error) {
      throw new AppError(
        'Failed to create order',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            data,
            timestamp: new Date(),
            context: 'createOrder'
          }
        }
      );
    }
  }

  @withPerformanceLogging('updateOrder', 'smokeShop.updateOrder')
  public async updateOrder(id: string, data: Partial<ISmokeShopOrder>): Promise<ISmokeShopOrder> {
    try {
      const order = await OrderModel.findByIdAndUpdate(id, data, { new: true });
      if (!order) {
        throw new AppError(
          'Order not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              orderId: id,
              timestamp: new Date(),
              context: 'updateOrder'
            }
          }
        );
      }
      return order;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to update order',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            orderId: id,
            data,
            timestamp: new Date(),
            context: 'updateOrder'
          }
        }
      );
    }
  }

  @withPerformanceLogging('deleteOrder', 'smokeShop.deleteOrder')
  public async deleteOrder(id: string): Promise<void> {
    try {
      const order = await OrderModel.findByIdAndDelete(id);
      if (!order) {
        throw new AppError(
          'Order not found',
          ErrorCode.NOT_FOUND,
          {
            errorType: ErrorType.BUSINESS,
            metadata: {
              orderId: id,
              timestamp: new Date(),
              context: 'deleteOrder'
            }
          }
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Failed to delete order',
        ErrorCode.DATABASE_ERROR,
        {
          errorType: ErrorType.TECHNICAL,
          metadata: {
            error,
            orderId: id,
            timestamp: new Date(),
            context: 'deleteOrder'
          }
        }
      );
    }
  }

  public getCategories = withPerformanceLogging(
    async () => {
      try {
        const categories = await this.model.distinct('category');
        return categories;
      } catch (error) {
        logger.error('Error getting categories:', error);
        throw new AppError('Failed to get categories', ErrorCode.INTERNAL_ERROR, {
          metadata: {
            errorType: ErrorType.TECHNICAL,
            timestamp: new Date().toISOString()
          }
        });
      }
    },
    'smokeShop.getCategories'
  );

  public createCategory = withPerformanceLogging(
    async (data: any) => {
      try {
        const category = await this.model.create(data);
        return category;
      } catch (error) {
        logger.error('Error creating category:', error);
        throw new AppError('Failed to create category', 500);
      }
    }
  );

  public updateCategory = withPerformanceLogging(
    async (id: string, data: any) => {
      try {
        const category = await this.model.findByIdAndUpdate(id, data, { new: true });
        if (!category) {
          throw new AppError('Category not found', 404);
        }
        return category;
      } catch (error) {
        logger.error('Error updating category:', error);
        throw new AppError('Failed to update category', 500);
      }
    }
  );

  public deleteCategory = withPerformanceLogging(
    async (id: string) => {
      try {
        const category = await this.model.findByIdAndDelete(id);
        if (!category) {
          throw new AppError('Category not found', 404);
        }
      } catch (error) {
        logger.error('Error deleting category:', error);
        throw new AppError('Failed to delete category', 500);
      }
    }
  );

  /**
   * Places an order for smoke shop products
   * @param userId - The ID of the user placing the order
   * @param shopId - The ID of the smoke shop
   * @param items - Array of order items
   * @param deliveryAddress - Delivery address for the order
   * @returns The created order
   * @throws AppError if shop not found, product not found, or invalid input
   */
  public async placeOrder(
    userId: Types.ObjectId,
    shopId: Types.ObjectId,
    items: IOrderItem[],
    deliveryAddress: string
  ): Promise<IOrder> {
    // Validate input
    if (!items.length) {
      throw new AppError('Order must contain at least one item', ErrorCode.INVALID_INPUT, {
        metadata: {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date().toISOString()
        }
      });
    }

    if (!deliveryAddress) {
      throw new AppError('Delivery address is required', ErrorCode.INVALID_INPUT, {
        metadata: {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Find shop
    const shop = await this.model.findById(shopId);
    if (!shop) {
      throw new AppError('Shop not found', ErrorCode.NOT_FOUND, {
        metadata: {
          errorType: ErrorType.BUSINESS,
          timestamp: new Date().toISOString(),
          context: { shopId }
        }
      });
    }

    // Validate items
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new AppError('Invalid quantity', ErrorCode.INVALID_INPUT, {
          metadata: {
            errorType: ErrorType.BUSINESS,
            timestamp: new Date().toISOString()
          }
        });
      }

      const product = shop.products.find(p => p._id.toString() === item.productId.toString());
      if (!product) {
        throw new AppError('Product not found in shop', ErrorCode.NOT_FOUND, {
          metadata: {
            errorType: ErrorType.BUSINESS,
            timestamp: new Date().toISOString(),
            context: { productId: item.productId }
          }
        });
      }

      if (!product.isAvailable) {
        throw new AppError('Product is not available', ErrorCode.INVALID_INPUT, {
          metadata: {
            errorType: ErrorType.BUSINESS,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // Calculate total amount
    const subtotal = items.reduce((total, item) => {
      const product = shop.products.find(p => p._id.toString() === item.productId.toString());
      return total + (product!.price * item.quantity);
    }, 0);

    const deliveryFee = await calculateDeliveryFee(
      { type: 'Point', coordinates: shop.location.coordinates },
      deliveryAddress
    );
    const totalAmount = subtotal + deliveryFee.fee;

    // Create order
    const order = await OrderModel.create({
      userId,
      businessId: shopId,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        name: shop.products.find(p => p._id.toString() === item.productId.toString())!.name
      })),
      totalAmount,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      deliveryAddress: {
        street: deliveryAddress,
        city: 'New York', // TODO: Parse address to get city
        state: 'NY', // TODO: Parse address to get state
        zipCode: '10001', // TODO: Parse address to get zip code
        country: 'USA',
        coordinates: [40.7128, -74.0060] // TODO: Geocode address
      }
    });

    return order.toObject() as unknown as IOrder;
  }

  public async cleanupOldOrders(): Promise<{ deletedCount: number }> {
    try {
      // For now, just return a mock result
      return { deletedCount: 0 };
    } catch (error) {
      logger.error('Error cleaning up old orders:', error);
      throw error;
    }
  }
} 