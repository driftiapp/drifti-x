import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Mock mongoose connect
mongoose.connect = jest.fn().mockResolvedValue(undefined);

// Mock mongoose models
jest.mock('../src/models/user.model');
jest.mock('../src/models/smokeShop.model');

// Set up MongoDB memory server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 