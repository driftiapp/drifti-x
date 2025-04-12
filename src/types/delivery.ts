import { Types } from 'mongoose';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface IDeliveryZone {
  _id?: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number; // in kilometers
  deliveryFee: number;
  minimumOrderAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryResponse {
  _id: string;
  businessId: string;
  name: string;
  description?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number;
  deliveryFee: number;
  minimumOrderAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
} 