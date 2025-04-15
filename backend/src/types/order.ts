import { Types, Document } from 'mongoose';
import { z } from 'zod';

/**
 * Enum representing the possible statuses of an order
 * @enum {string}
 */
export enum OrderStatus {
  /** Order has been created but not yet confirmed */
  PENDING = 'PENDING',
  /** Order has been confirmed by the merchant */
  CONFIRMED = 'CONFIRMED',
  /** Order is being prepared by the merchant */
  PREPARING = 'PREPARING',
  /** Order is ready for delivery */
  READY = 'READY',
  /** Order is being delivered */
  DELIVERING = 'DELIVERING',
  /** Order has been delivered and completed */
  COMPLETED = 'COMPLETED',
  /** Order has been cancelled */
  CANCELLED = 'CANCELLED',
  /** Order has been picked up by the customer */
  PICKED_UP = 'PICKED_UP',
  /** Order has been delivered to the customer */
  DELIVERED = 'DELIVERED',
  /** Order has been accepted by the merchant */
  ACCEPTED = 'ACCEPTED',
  /** Order is in transit */
  IN_TRANSIT = 'IN_TRANSIT'
}

/**
 * Enum representing the possible payment statuses of an order
 * @enum {string}
 */
export enum PaymentStatus {
  /** Payment has not been processed yet */
  PENDING = 'PENDING',
  /** Payment has been successfully processed */
  PAID = 'PAID',
  /** Payment processing failed */
  FAILED = 'FAILED',
  /** Payment has been refunded */
  REFUNDED = 'REFUNDED'
}

/**
 * Enum representing the possible payment methods of an order
 * @enum {string}
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  CASH = 'CASH',
  PAYPAL = 'PAYPAL'
}

/**
 * Interface representing the base order structure
 * @interface IBaseOrder
 */
export interface IBaseOrder {
  /** The unique identifier of the order */
  _id: Types.ObjectId;
  /** The current status of the order */
  status: OrderStatus;
  /** The current payment status of the order */
  paymentStatus: PaymentStatus;
  /** The total amount of the order */
  totalAmount: number;
  /** The delivery fee for the order */
  deliveryFee: number;
  /** The date and time when the order was created */
  createdAt: Date;
  /** The date and time when the order was last updated */
  updatedAt: Date;
}

/**
 * Interface for order search criteria
 * @interface IOrderSearchCriteria
 */
export interface IOrderSearchCriteria {
  /** Filter by order status */
  status?: OrderStatus;
  /** Filter by payment status */
  paymentStatus?: PaymentStatus;
  /** Filter orders created after this date */
  createdAfter?: Date;
  /** Filter orders created before this date */
  createdBefore?: Date;
  /** Filter orders with total amount greater than or equal to this value */
  minAmount?: number;
  /** Filter orders with total amount less than or equal to this value */
  maxAmount?: number;
  /** Filter by customer ID */
  customer?: Types.ObjectId;
  /** Filter by merchant ID */
  store?: Types.ObjectId;
  /** Filter by delivery address */
  deliveryAddress?: string;
  /** Filter by driver ID */
  driver?: Types.ObjectId;
  /** Filter by active status */
  isActive?: boolean;
}

/**
 * Interface for paginated order results
 * @interface IOrderPaginatedResult
 * @template T - The type of order
 */
export interface IOrderPaginatedResult<T extends IBaseOrder> {
  /** The list of orders */
  orders: T[];
  /** The total number of orders */
  total: number;
  /** The current page number */
  page: number;
  /** The number of orders per page */
  limit: number;
  /** The total number of pages */
  totalPages: number;
}

/**
 * Interface for order status update
 * @interface IOrderStatusUpdate
 */
export interface IOrderStatusUpdate {
  /** The new status of the order */
  status: OrderStatus;
  /** The reason for the status update */
  reason?: string;
  /** The ID of the user who updated the status */
  updatedBy?: Types.ObjectId;
}

/**
 * Interface for order payment status update
 * @interface IOrderPaymentStatusUpdate
 */
export interface IOrderPaymentStatusUpdate {
  /** The new payment status of the order */
  paymentStatus: PaymentStatus;
  /** The ID of the payment transaction */
  paymentId?: string;
  /** The reason for the payment status update */
  reason?: string;
  /** The ID of the user who updated the payment status */
  updatedBy?: Types.ObjectId;
}

/**
 * Interface for order delivery fee update
 * @interface IOrderDeliveryFeeUpdate
 */
export interface IOrderDeliveryFeeUpdate {
  /** The new delivery fee */
  deliveryFee: number;
  /** The reason for the delivery fee update */
  reason?: string;
  /** The ID of the user who updated the delivery fee */
  updatedBy?: Types.ObjectId;
}

/**
 * Interface for order item
 * @interface IOrderItem
 */
export interface IOrderItem {
  /** The ID of the product */
  productId: Types.ObjectId;
  /** The name of the product */
  name: string;
  /** The quantity of the product */
  quantity: number;
  /** The price per unit */
  unitPrice: number;
  /** The total price for this item */
  totalPrice: number;
  /** Any special instructions for this item */
  instructions?: string;
}

/**
 * Interface for order delivery details
 * @interface IOrderDeliveryDetails
 */
export interface IOrderDeliveryDetails {
  /** The delivery address */
  address: string;
  /** The delivery coordinates */
  coordinates: [number, number];
  /** The delivery instructions */
  instructions?: string;
  /** The estimated delivery time */
  estimatedDeliveryTime?: Date;
  /** The actual delivery time */
  actualDeliveryTime?: Date;
}

/**
 * Interface for order customer details
 * @interface IOrderCustomerDetails
 */
export interface IOrderCustomerDetails {
  /** The ID of the customer */
  customerId: Types.ObjectId;
  /** The name of the customer */
  name: string;
  /** The phone number of the customer */
  phoneNumber: string;
  /** The email of the customer */
  email?: string;
}

/**
 * Interface for order statistics
 * @interface IOrderStats
 */
export interface IOrderStats {
  /** The total number of orders */
  totalOrders: number;
  /** The number of orders by status */
  ordersByStatus: Record<OrderStatus, number>;
  /** The number of orders by payment status */
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  /** The total revenue from orders */
  totalRevenue: number;
  /** The average order value */
  averageOrderValue: number;
}

/**
 * Interface for order analytics
 * @interface IOrderAnalytics
 */
export interface IOrderAnalytics {
  /** The order statistics */
  stats: IOrderStats;
  /** The trend of orders over time */
  trend: {
    /** The date */
    date: Date;
    /** The number of orders */
    count: number;
    /** The total revenue */
    revenue: number;
  }[];
}

/**
 * Interface for order delivery address
 * @interface IOrderDeliveryAddress
 */
export interface IOrderDeliveryAddress {
  /** The street address */
  street: string;
  /** The city */
  city: string;
  /** The state */
  state: string;
  /** The zip code */
  zipCode: string;
  /** The coordinates of the address */
  coordinates?: {
    /** The latitude */
    lat: number;
    /** The longitude */
    lng: number;
  };
}

/**
 * Zod schema for order status update validation
 */
export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().optional(),
  updatedBy: z.instanceof(Types.ObjectId).optional()
});

/**
 * Zod schema for order payment status update validation
 */
export const orderPaymentStatusUpdateSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentId: z.string().optional(),
  reason: z.string().optional(),
  updatedBy: z.instanceof(Types.ObjectId).optional()
});

/**
 * Zod schema for order delivery fee update validation
 */
export const orderDeliveryFeeUpdateSchema = z.object({
  deliveryFee: z.number().min(0),
  reason: z.string().optional(),
  updatedBy: z.instanceof(Types.ObjectId).optional()
});

/**
 * Zod schema for order search criteria validation
 */
export const orderSearchCriteriaSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  customer: z.instanceof(Types.ObjectId).optional(),
  store: z.instanceof(Types.ObjectId).optional(),
  driver: z.instanceof(Types.ObjectId).optional(),
  isActive: z.boolean().optional()
});

/**
 * Helper function to validate order status update
 * @param data - The order status update data
 * @returns The validated order status update
 * @throws {z.ZodError} If validation fails
 */
export function validateOrderStatusUpdate(data: unknown): IOrderStatusUpdate {
  return orderStatusUpdateSchema.parse(data);
}

/**
 * Helper function to validate order payment status update
 * @param data - The order payment status update data
 * @returns The validated order payment status update
 * @throws {z.ZodError} If validation fails
 */
export function validateOrderPaymentStatusUpdate(data: unknown): IOrderPaymentStatusUpdate {
  return orderPaymentStatusUpdateSchema.parse(data);
}

/**
 * Helper function to validate order delivery fee update
 * @param data - The order delivery fee update data
 * @returns The validated order delivery fee update
 * @throws {z.ZodError} If validation fails
 */
export function validateOrderDeliveryFeeUpdate(data: unknown): IOrderDeliveryFeeUpdate {
  return orderDeliveryFeeUpdateSchema.parse(data);
}

/**
 * Helper function to validate order search criteria
 * @param data - The order search criteria
 * @returns The validated order search criteria
 * @throws {z.ZodError} If validation fails
 */
export function validateOrderSearchCriteria(data: unknown): IOrderSearchCriteria {
  return orderSearchCriteriaSchema.parse(data);
}

/**
 * Order interface
 */
export interface IOrder extends Document {
  _id: Types.ObjectId;
  customer: Types.ObjectId;
  store: Types.ObjectId;
  driver?: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: [number, number];
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
} 