import { Types, Document } from 'mongoose';
import { z } from 'zod';
import { OrderStatus, PaymentStatus } from './order';

/**
 * Enum representing the possible statuses of a liquor order
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

/**
 * Interface representing a liquor order item
 */
export interface ILiquorOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  volume?: number;
  alcoholContent?: number;
}

/**
 * Interface representing delivery address coordinates
 */
export interface ICoordinates {
  lat: number;
  lng: number;
}

/**
 * Interface representing a delivery address
 */
export interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: ICoordinates;
  apartment?: string;
  floor?: string;
  instructions?: string;
}

/**
 * Interface for a liquor order
 * @interface ILiquorOrder
 * @extends {Document}
 */
export interface ILiquorOrder extends Document {
  customer: string;
  store: string;
  driver?: string;
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;

  // Virtual fields
  totalWithFee: number;
  isPaid: boolean;
  isCompleted: boolean;
  isCancelled: boolean;

  // Instance methods
  updateStatus(newStatus: OrderStatus, reason?: string): Promise<ILiquorOrder>;
  updatePaymentStatus(newPaymentStatus: PaymentStatus): Promise<ILiquorOrder>;
}

/**
 * Interface for creating a new liquor order
 */
export interface ILiquorOrderCreate {
  customer: Types.ObjectId;
  store: Types.ObjectId;
  items: ILiquorOrderItem[];
  deliveryAddress: IDeliveryAddress;
  notes?: string;
}

/**
 * Interface for updating a liquor order
 */
export interface ILiquorOrderUpdate {
  driver?: Types.ObjectId;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryAddress?: IDeliveryAddress;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  cancellationReason?: string;
  cancellationBy?: Types.ObjectId;
  notes?: string;
}

/**
 * Interface for liquor order search criteria
 */
export interface ILiquorOrderSearchCriteria {
  customer?: Types.ObjectId;
  store?: Types.ObjectId;
  driver?: Types.ObjectId;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  isActive?: boolean;
  hasDriver?: boolean;
}

/**
 * Interface for paginated liquor order results
 */
export interface ILiquorOrderPaginatedResult {
  orders: ILiquorOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Zod schema for liquor order item validation
 */
export const liquorOrderItemSchema = z.object({
  product: z.instanceof(Types.ObjectId),
  quantity: z.number().min(1),
  price: z.number().min(0),
  name: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  volume: z.number().min(0).optional(),
  alcoholContent: z.number().min(0).max(100).optional()
});

/**
 * Zod schema for coordinates validation
 */
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

/**
 * Zod schema for delivery address validation
 */
export const deliveryAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  coordinates: coordinatesSchema.optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  instructions: z.string().optional()
});

/**
 * Zod schema for liquor order creation validation
 */
export const liquorOrderCreateSchema = z.object({
  customer: z.instanceof(Types.ObjectId),
  store: z.instanceof(Types.ObjectId),
  items: z.array(liquorOrderItemSchema).min(1),
  deliveryAddress: deliveryAddressSchema,
  notes: z.string().optional()
});

/**
 * Zod schema for liquor order update validation
 */
export const liquorOrderUpdateSchema = z.object({
  driver: z.instanceof(Types.ObjectId).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  estimatedDeliveryTime: z.date().optional(),
  actualDeliveryTime: z.date().optional(),
  cancellationReason: z.string().optional(),
  cancellationBy: z.instanceof(Types.ObjectId).optional(),
  notes: z.string().optional()
});

/**
 * Zod schema for liquor order search criteria validation
 */
export const liquorOrderSearchCriteriaSchema = z.object({
  customer: z.instanceof(Types.ObjectId).optional(),
  store: z.instanceof(Types.ObjectId).optional(),
  driver: z.instanceof(Types.ObjectId).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  hasDriver: z.boolean().optional()
});

/**
 * Helper function to validate liquor order item
 * @param data - The liquor order item data
 * @returns The validated liquor order item
 * @throws {z.ZodError} If validation fails
 */
export function validateLiquorOrderItem(data: unknown): ILiquorOrderItem {
  return liquorOrderItemSchema.parse(data);
}

/**
 * Helper function to validate delivery address
 * @param data - The delivery address data
 * @returns The validated delivery address
 * @throws {z.ZodError} If validation fails
 */
export function validateDeliveryAddress(data: unknown): IDeliveryAddress {
  return deliveryAddressSchema.parse(data);
}

/**
 * Helper function to validate liquor order creation
 * @param data - The liquor order creation data
 * @returns The validated liquor order creation
 * @throws {z.ZodError} If validation fails
 */
export function validateLiquorOrderCreate(data: unknown): ILiquorOrderCreate {
  return liquorOrderCreateSchema.parse(data);
}

/**
 * Helper function to validate liquor order update
 * @param data - The liquor order update data
 * @returns The validated liquor order update
 * @throws {z.ZodError} If validation fails
 */
export function validateLiquorOrderUpdate(data: unknown): ILiquorOrderUpdate {
  return liquorOrderUpdateSchema.parse(data);
}

/**
 * Helper function to validate liquor order search criteria
 * @param data - The liquor order search criteria
 * @returns The validated liquor order search criteria
 * @throws {z.ZodError} If validation fails
 */
export function validateLiquorOrderSearchCriteria(data: unknown): ILiquorOrderSearchCriteria {
  return liquorOrderSearchCriteriaSchema.parse(data);
} 