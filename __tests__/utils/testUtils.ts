import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../../models/user.model';
import { ISmokeShop } from '../../models/smokeShop.model';
import { AppError } from '../../utils/AppError';

export interface MockRequest extends Partial<Request> {
  user?: any;
  cookies?: { [key: string]: string };
  headers?: { [key: string]: string };
}

export interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
}

export const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => ({
  body: {},
  params: {},
  query: {},
  cookies: {},
  headers: {},
  ...overrides
});

export const createMockResponse = (): MockResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis()
});

export const createMockNext = (): NextFunction => jest.fn();

export const createMockUser = (overrides: Partial<IUser> = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  email: 'test@example.com',
  password: 'hashedPassword123',
  role: 'user',
  isActive: true,
  ...overrides
});

export const createMockShop = (overrides: Partial<ISmokeShop> = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Shop',
  description: 'A test smoke shop',
  address: '123 Test St',
  location: {
    type: 'Point',
    coordinates: [-73.935242, 40.730610] as [number, number]
  },
  contact: {
    phone: '123-456-7890',
    email: 'test@example.com'
  },
  products: [],
  openingHours: [],
  rating: 0,
  ratingCount: 0,
  ...overrides
});

export const createMockProduct = (overrides: Partial<any> = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Product',
  description: 'A test product',
  price: 19.99,
  category: 'Accessories',
  isAvailable: true,
  ...overrides
});

export const createMockError = (message: string, statusCode: number = 500) => 
  new AppError(message, statusCode);

export const setupTestDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  await mongoose.connect(mongoUri);
};

export const teardownTestDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

export const clearTestCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}; 