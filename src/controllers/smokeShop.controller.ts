import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Order } from '../models/order.model';
import { SmokeShop } from '../models/smokeShop.model';
import { SmokeShopService } from '../services/smokeShop.service';
import { OrderStatus, PaymentStatus } from '../types/order';
import { IOrder, IOrderItem, IOrderResponse } from '../types/smokeShop';

export const smokeShopController = {
  async placeOrder(req: Request, res: Response) {
    const { shopId, items, deliveryAddress } = req.body;
    const userId = req.user?.userId;

    // Verify shop exists
    const shop = await SmokeShop.findById(shopId);
    if (!shop) {
      throw new AppError(404, 'Smoke shop not found');
    }

    // Calculate total price
    const totalPrice = items.reduce((total: number, item: any) => {
      const product = shop.products.find((p: any) => {
        const productId = p._id?.toString() || p._id;
        return productId === item.productId;
      });
      if (!product) {
        throw new AppError(400, `Product ${item.productId} not found in shop inventory`);
      }
      return total + product.price * item.quantity;
    }, 0);

    const order = await Order.create({
      customer: userId,
      shop: shopId,
      items,
      deliveryAddress,
      totalPrice,
      status: 'pending',
    });

    logger.info(`New smoke shop order placed: ${order._id}`);

    res.status(201).json({
      status: 'success',
      data: {
        order,
      },
    });
  },

  async getMyOrders(req: Request, res: Response) {
    const userId = req.user?.userId;
    const orders = await Order.find({ customer: userId })
      .sort({ createdAt: -1 })
      .populate('shop', 'name')
      .populate('driver', 'name');

    res.json({
      status: 'success',
      data: orders,
    });
  },

  async getOrderDetails(req: Request, res: Response) {
    const order = await Order.findById(req.params.id)
      .populate('shop', 'name address')
      .populate('driver', 'name')
      .populate('customer', 'name');

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    res.json({
      status: 'success',
      data: order,
    });
  },

  async cancelOrder(req: Request, res: Response) {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'pending') {
      throw new AppError(400, 'Cannot cancel order in current status');
    }

    order.status = 'cancelled';
    await order.save();

    logger.info(`Order cancelled: ${order._id}`);

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
    });
  },

  async rateOrder(req: Request, res: Response) {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'delivered') {
      throw new AppError(400, 'Can only rate delivered orders');
    }

    order.rating = rating;
    order.comment = comment;
    await order.save();

    logger.info(`Order rated: ${order._id} - ${rating} stars`);

    res.json({
      status: 'success',
      message: 'Order rated successfully',
    });
  },

  async getShopOrders(req: Request, res: Response) {
    const shopId = req.user?.userId;
    const orders = await Order.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .populate('customer', 'name');

    res.json({
      status: 'success',
      data: orders,
    });
  },

  async acceptOrder(req: Request, res: Response) {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'pending') {
      throw new AppError(400, 'Order is not available for acceptance');
    }

    order.status = 'accepted';
    await order.save();

    logger.info(`Order accepted: ${order._id}`);

    res.json({
      status: 'success',
      message: 'Order accepted successfully',
    });
  },

  async prepareOrder(req: Request, res: Response) {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'accepted') {
      throw new AppError(400, 'Cannot prepare order in current status');
    }

    order.status = 'preparing';
    await order.save();

    logger.info(`Order preparation started: ${order._id}`);

    res.json({
      status: 'success',
      message: 'Order preparation started',
    });
  },

  async markOrderReady(req: Request, res: Response) {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'preparing') {
      throw new AppError(400, 'Cannot mark order as ready in current status');
    }

    order.status = 'ready_for_pickup';
    await order.save();

    logger.info(`Order ready for pickup: ${order._id}`);

    res.json({
      status: 'success',
      message: 'Order marked as ready for pickup',
    });
  },

  async getAvailableOrders(req: Request, res: Response) {
    const orders = await Order.find({ status: 'ready_for_pickup' })
      .populate('shop', 'name address')
      .sort({ createdAt: 1 });

    res.json({
      status: 'success',
      data: orders,
    });
  },

  async pickupOrder(req: Request, res: Response) {
    const driverId = req.user?.userId;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'ready_for_pickup') {
      throw new AppError(400, 'Order is not ready for pickup');
    }

    order.driver = driverId;
    order.status = 'picked_up';
    await order.save();

    logger.info(`Order picked up: ${order._id} by driver ${driverId}`);

    res.json({
      status: 'success',
      message: 'Order picked up successfully',
    });
  },

  async deliverOrder(req: Request, res: Response) {
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== 'picked_up') {
      throw new AppError(400, 'Cannot deliver order in current status');
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();

    logger.info(`Order delivered: ${order._id}`);

    res.json({
      status: 'success',
      message: 'Order delivered successfully',
    });
  },

  async getDriverEarnings(req: Request, res: Response) {
    const driverId = req.user?.userId;
    const orders = await Order.find({
      driver: driverId,
      status: 'delivered',
    });

    const earnings = orders.reduce((total, order) => total + (order.deliveryFee || 0), 0);

    res.json({
      status: 'success',
      data: {
        totalEarnings: earnings,
        completedDeliveries: orders.length,
      },
    });
  },

  static async createShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.createShop(req.body);
      res.status(201).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async getShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.getShopById(req.params.id);
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async updateShop(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.updateShop(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async deleteShop(req: Request, res: Response, next: NextFunction) {
    try {
      await SmokeShopService.deleteShop(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  static async getShopsNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius = 5000 } = req.query;
      
      if (!lat || !lng) {
        throw new AppError('Latitude and longitude are required', 400);
      }

      const coordinates: [number, number] = [
        parseFloat(lat as string),
        parseFloat(lng as string)
      ];

      const shops = await SmokeShopService.getShopsNearby(
        coordinates,
        parseInt(radius as string)
      );

      res.status(200).json({
        status: 'success',
        results: shops.length,
        data: shops
      });
    } catch (error) {
      next(error);
    }
  },

  static async addProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.addProduct(req.params.id, req.body);
      res.status(201).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.updateProduct(
        req.params.id,
        req.params.productId,
        req.body
      );
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.deleteProduct(
        req.params.id,
        req.params.productId
      );
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async updateOpeningHours(req: Request, res: Response, next: NextFunction) {
    try {
      const shop = await SmokeShopService.updateOpeningHours(
        req.params.id,
        req.body
      );
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },

  static async updateRating(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating } = req.body;
      
      if (!rating || rating < 0 || rating > 5) {
        throw new AppError('Rating must be between 0 and 5', 400);
      }

      const shop = await SmokeShopService.updateRating(req.params.id, rating);
      res.status(200).json({
        status: 'success',
        data: shop
      });
    } catch (error) {
      next(error);
    }
  },
}; 