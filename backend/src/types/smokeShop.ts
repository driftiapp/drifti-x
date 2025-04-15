import { Document } from 'mongoose';

export interface IProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isAvailable: boolean;
}

export interface IOpeningHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  open: string;
  close: string;
}

export interface IContact {
  phone: string;
  email: string;
}

export interface ICoordinates {
  type: 'Point';
  coordinates: [number, number];
}

export interface ISmokeShop extends Document {
  name: string;
  description: string;
  address: string;
  location: ICoordinates;
  contact: IContact;
  products: IProduct[];
  openingHours: IOpeningHours[];
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISmokeShopProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISmokeShopOrder extends Document {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISmokeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISmokeOrder {
  id: string;
  userId: string;
  products: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ISmokeCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
} 