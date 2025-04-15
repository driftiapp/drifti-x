import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { ErrorCode } from '../types/error';

// MongoDB connection options
const mongoOptions: mongoose.ConnectOptions = {
  maxPoolSize: config.mongoPoolSize,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  retryReads: true,
  autoIndex: true,
  autoCreate: true,
};

// MongoDB connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Establishes a connection to MongoDB
 * @returns Promise<void>
 */
export async function connectToMongoDB(): Promise<void> {
  if (isConnected) {
    logger.info('MongoDB is already connected');
    return;
  }

  try {
    // Build connection URI
    let uri = config.mongoUri;
    if (config.mongoUser && config.mongoPass) {
      uri = uri.replace('mongodb://', `mongodb://${config.mongoUser}:${config.mongoPass}@`);
    }

    // Connect to MongoDB
    await mongoose.connect(uri, mongoOptions);
    isConnected = true;
    connectionAttempts = 0;

    logger.info('Successfully connected to MongoDB');
    
    // Set up connection event handlers
    mongoose.connection.on('error', handleMongoError);
    mongoose.connection.on('disconnected', handleMongoDisconnect);
    mongoose.connection.on('reconnected', handleMongoReconnect);
  } catch (error) {
    connectionAttempts++;
    
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      throw new AppError(
        'Failed to connect to MongoDB after multiple attempts',
        ErrorCode.DATABASE_ERROR,
        {
          metadata: { error, attempts: connectionAttempts },
          errorType: 'technical',
          errorSource: 'database'
        }
      );
    }

    logger.error(`MongoDB connection attempt ${connectionAttempts} failed:`, error);
    throw new AppError('Failed to connect to MongoDB', ErrorCode.DATABASE_ERROR, {
      metadata: { error },
      errorType: 'technical',
      errorSource: 'database'
    });
  }
}

/**
 * Handles MongoDB connection errors
 * @param error - The error object
 */
function handleMongoError(error: Error): void {
  isConnected = false;
  logger.error('MongoDB connection error:', error);
  
  throw new AppError('MongoDB connection error', ErrorCode.DATABASE_ERROR, {
    metadata: { error },
    errorType: 'technical',
    errorSource: 'database'
  });
}

/**
 * Handles MongoDB disconnection events
 */
function handleMongoDisconnect(): void {
  isConnected = false;
  logger.warn('MongoDB disconnected');
  
  // Attempt to reconnect
  setTimeout(() => {
    if (!isConnected) {
      logger.info('Attempting to reconnect to MongoDB...');
      connectToMongoDB().catch((error) => {
        logger.error('Failed to reconnect to MongoDB:', error);
      });
    }
  }, 5000);
}

/**
 * Handles MongoDB reconnection events
 */
function handleMongoReconnect(): void {
  isConnected = true;
  logger.info('MongoDB reconnected');
}

/**
 * Closes the MongoDB connection
 * @returns Promise<void>
 */
export async function closeMongoDBConnection(): Promise<void> {
  if (!isConnected) {
    logger.info('MongoDB is not connected');
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw new AppError('Failed to close MongoDB connection', ErrorCode.DATABASE_ERROR, {
      metadata: { error },
      errorType: 'technical',
      errorSource: 'database'
    });
  }
}

/**
 * Checks if MongoDB is connected
 * @returns boolean
 */
export function isMongoDBConnected(): boolean {
  return isConnected;
}

// Export mongoose instance for direct use if needed
export { mongoose }; 