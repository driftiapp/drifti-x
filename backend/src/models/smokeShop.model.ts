import mongoose from 'mongoose';
import { ISmokeShopProduct } from '../types/smokeShop';

const smokeShopSchema = new mongoose.Schema<ISmokeShopProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Product description must be at least 10 characters long'],
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Product price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Product stock cannot be negative'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
smokeShopSchema.index({ name: 'text', description: 'text' });
smokeShopSchema.index({ category: 1 });
smokeShopSchema.index({ price: 1 });
smokeShopSchema.index({ stock: 1 });

export const SmokeShopModel = mongoose.model<ISmokeShopProduct>('SmokeShop', smokeShopSchema); 