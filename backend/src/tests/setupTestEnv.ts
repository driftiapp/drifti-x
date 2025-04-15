import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Extend the config interface to include jwt and redis
interface IConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    url: string;
  };
  // ... other config properties
}

let mongoServer: MongoMemoryServer;
let redisClient: Redis;

export const setupTestEnv = async () => {
  // Start MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to MongoDB
  await mongoose.connect(mongoUri);
  logger.info('Connected to MongoDB for testing');

  // Setup Redis client
  redisClient = new Redis(config.redis.url);
  logger.info('Connected to Redis for testing');

  // Clear Redis before tests
  await redisClient.flushall();
};

export const teardownTestEnv = async () => {
  // Disconnect from MongoDB
  await mongoose.disconnect();
  await mongoServer.stop();
  logger.info('Disconnected from MongoDB');

  // Close Redis connection
  await redisClient.quit();
  logger.info('Disconnected from Redis');
};

export const clearTestData = async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Clear Redis
  await redisClient.flushall();
};

// Mock logger for tests
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Mock config for tests
export const mockConfig: IConfig = {
  ...config,
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h',
  },
  redis: {
    url: 'redis://localhost:6379',
  },
};

// Mock request headers
export const mockRequestHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'x-forwarded-for': '127.0.0.1',
  'accept-language': 'en-US,en;q=0.9',
};

// Test user data
export const testUserData = {
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
};

// Test admin data
export const testAdminData = {
  email: 'admin@example.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
}; 