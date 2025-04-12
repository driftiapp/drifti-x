import { Types, Document } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus, IDeliveryAddress } from './order';
import { IUser } from './user';

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface IOpeningHours {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  description?: string;
  image?: string;
}

export interface IOrder {
  _id: string;
  customer: IUser;
  shop: ISmokeShop;
  items: IOrderItem[];
  deliveryAddress: IDeliveryAddress;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  driver?: IUser;
  deliveredAt?: Date;
  rating?: number;
  comment?: string;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderResponse {
  success: boolean;
  data: IOrder | IOrder[];
  timestamp: string;
}

export interface ISmokeShop extends Document {
  name: string;
  description: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  contact: {
    phone: string;
    email: string;
  };
  products: IProduct[];
  openingHours: IOpeningHours[];
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
} 