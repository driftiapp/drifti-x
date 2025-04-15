import { config } from '../config';

// Store original environment
const originalEnv = { ...process.env };

// Helper to set environment variables
export const setTestEnv = (env: Record<string, string | undefined>) => {
  process.env = { ...originalEnv, ...env };
};

// Helper to restore original environment
export const restoreEnv = () => {
  process.env = { ...originalEnv };
};

// Set default test environment
setTestEnv({
  NODE_ENV: 'test',
  PORT: '5000',
  MONGODB_URI: 'mongodb://localhost:27017/driftix-test',
  JWT_SECRET: 'test-secret-key',
  FRONTEND_URL: 'http://localhost:3000',
  LOG_LEVEL: 'error'
});

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create a mock ObjectId class
class MockObjectId {
  constructor(id?: string) {
    return id || 'mock-object-id';
  }
  toString() {
    return 'mock-object-id';
  }
}

interface SchemaDefinition {
  [key: string]: any;
}

interface SchemaOptions {
  timestamps?: boolean;
  [key: string]: any;
}

// Create a mock Schema class with proper typing
class MockSchema {
  static Types: {
    ObjectId: typeof MockObjectId;
    String: StringConstructor;
    Number: NumberConstructor;
    Boolean: BooleanConstructor;
    Date: DateConstructor;
  };

  constructor(definition: SchemaDefinition, options?: SchemaOptions) {
    const schema = {
      ...definition,
      index: jest.fn().mockReturnThis(),
    };
    return schema;
  }
}

// Define static types
MockSchema.Types = {
  ObjectId: MockObjectId,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
};

// Mock mongoose with proper types
jest.mock('mongoose', () => {
  const mongoose = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    Schema: MockSchema,
    model: jest.fn().mockReturnValue({}),
    Types: MockSchema.Types,
  };
  
  return mongoose;
});

// Global test timeout
jest.setTimeout(10000); 