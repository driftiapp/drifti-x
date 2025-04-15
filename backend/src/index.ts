import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/requestLogger';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websockets';
import { logger } from './utils/logger';
import compression from 'compression';
import connectToDatabase from '../../src/lib/mongodb';
import { setupMonitoring } from './monitoring';
import { auth } from './middlewares/auth';

// Load environment variables
config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Create Socket.IO server
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    logger.info('✅ MongoDB connected successfully');
  })
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Setup routes
setupRoutes(app, io);

// Setup WebSocket
setupWebSocket(io);

// Setup monitoring
setupMonitoring();

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
}); 