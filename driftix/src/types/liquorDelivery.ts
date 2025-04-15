import { Types, Document } from 'mongoose';
import { OrderStatus, PaymentStatus } from './order';

/**
 * Interface representing a liquor order item
 */
export interface ILiquorOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
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
}

/**
 * Interface representing a liquor order in the database
 */
export interface ILiquorOrder extends Document {
  customer: Types.ObjectId;
  store: Types.ObjectId;
  driver?: Types.ObjectId;
  items: ILiquorOrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryAddress: IDeliveryAddress;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for creating a new liquor order
 */
export interface ILiquorOrderCreate {
  customer: Types.ObjectId;
  store: Types.ObjectId;
  items: ILiquorOrderItem[];
  deliveryAddress: IDeliveryAddress;
}

/**
 * Interface for updating a liquor order
 */
export interface ILiquorOrderUpdate {
  driver?: Types.ObjectId;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryAddress?: IDeliveryAddress;
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