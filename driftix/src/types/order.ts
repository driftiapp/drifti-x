/**
 * Enum representing the possible statuses of an order
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enum representing the possible payment statuses of an order
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

/**
 * Interface representing the base order structure
 */
export interface IBaseOrder {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for order search criteria
 */
export interface IOrderSearchCriteria {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Interface for paginated order results
 */
export interface IOrderPaginatedResult<T extends IBaseOrder> {
  orders: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface for order status update
 */
export interface IOrderStatusUpdate {
  status: OrderStatus;
  reason?: string;
}

/**
 * Interface for order payment status update
 */
export interface IOrderPaymentStatusUpdate {
  paymentStatus: PaymentStatus;
  paymentId?: string;
  reason?: string;
}

/**
 * Interface for order delivery fee update
 */
export interface IOrderDeliveryFeeUpdate {
  deliveryFee: number;
  reason?: string;
} 