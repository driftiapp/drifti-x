import { z } from 'zod';
import { Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface IMenuItem {
  _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface IOrder {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  restaurant: Types.ObjectId;
  items: {
    item: Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: [number, number];
  };
  assignedDriver?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderResponse {
  success: boolean;
  data: IOrder;
  timestamp: string;
}

// Validation schemas
export const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean()
});

export const orderItemSchema = z.object({
  item: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid item ID'
  }),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

export const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  coordinates: z.tuple([z.number(), z.number()])
});

export const orderSchema = z.object({
  restaurant: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid restaurant ID'
  }),
  items: z.array(orderItemSchema).min(1),
  deliveryAddress: deliveryAddressSchema
}); 