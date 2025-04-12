import { Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: [number, number];
}

export interface IFoodOrder {
  id: string;
  customerId: string;
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: IDeliveryAddress;
  assignedDriverId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFoodOrderResponse {
  success: boolean;
  data: IFoodOrder;
  timestamp: string;
}

export interface IRestaurantMenu {
  id: string;
  restaurantId: string;
  items: IMenuItem[];
  categories: string[];
  lastUpdated: Date;
} 