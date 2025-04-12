import { Types } from 'mongoose';
import { SmokeShop } from '../models/smokeShop.model';
import { OrderModel } from '../models/order.model';
import { IProduct, ISmokeShop } from '../types/smokeShop';
import { IOrder, IOrderItem } from '../types/order';
import { calculateDeliveryFee } from '../utils/deliveryUtils';
import { AppError } from '../utils/errorHandler';

export class SmokeShopService {
  async placeOrder(
    userId: Types.ObjectId,
    shopId: Types.ObjectId,
    items: IOrderItem[],
    deliveryAddress: string
  ): Promise<IOrder> {
    // Verify smoke shop exists
    const shop = await SmokeShop.findById(shopId).lean();
    if (!shop) {
      throw new AppError('Smoke shop not found', 404);
    }

    // Calculate total price and verify products
    const totalPrice = items.reduce((total, item) => {
      const product = shop.products.find((p: IProduct) => {
        const productId = typeof item.productId === 'string' ? item.productId : item.productId.toString();
        return p._id === productId;
      });
      if (!product) {
        throw new AppError(`Product ${item.productId} not found in shop`, 404);
      }
      return total + (product.price * item.quantity);
    }, 0);

    // Calculate delivery fee
    const deliveryFee = await calculateDeliveryFee(shop.location.coordinates, deliveryAddress);

    // Create order
    const order = await OrderModel.create({
      userId,
      shopId,
      items,
      totalAmount: totalPrice + deliveryFee,
      deliveryFee,
      shippingAddress: deliveryAddress,
      status: 'pending'
    });

    return order;
  }
} 