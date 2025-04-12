import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct {
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

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String },
  isAvailable: { type: Boolean, default: true }
});

const openingHoursSchema = new Schema({
  day: { type: String, required: true },
  open: { type: String, required: true },
  close: { type: String, required: true },
  isClosed: { type: Boolean, default: false }
});

const smokeShopSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  products: [productSchema],
  openingHours: [openingHoursSchema],
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

smokeShopSchema.index({ location: '2dsphere' });

export const SmokeShop = mongoose.model<ISmokeShop>('SmokeShop', smokeShopSchema); 