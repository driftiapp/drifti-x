import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import smokeShopRoutes from './routes/smokeShop.routes';
import testRoutes from './routes/test.routes';
import healthRoutes from './routes/health.routes';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import { AppError, ErrorCode } from './utils/errors';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drifti-x')
  .then(() => logger.info('✅ Connected to MongoDB'))
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error);
    throw new AppError('Failed to connect to MongoDB', ErrorCode.DATABASE_ERROR, {
      metadata: { error },
      errorType: 'technical',
      errorSource: 'database',
      context: { operation: 'database_connection' }
    });
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/smoke-shop', smokeShopRoutes);
app.use('/api/test', testRoutes);
app.use('/api/health', healthRouter);

// Error handling
app.use(errorHandler);

export default app; 