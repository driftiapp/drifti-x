import { logger } from '../utils/logger';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

export const setupHealthCheck = (io?: Server): void => {
  try {
    // Setup periodic health checks
    setInterval(() => {
      const health = {
        timestamp: new Date().toISOString(),
        status: 'ok',
        services: {
          database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          redis: 'unknown', // Will be updated when Redis connection is established
          websocket: io ? 'connected' : 'disconnected'
        }
      };
      
      logger.info('Health check:', health);
      
      // Emit health status to connected clients
      if (io) {
        io.emit('health', health);
      }
    }, 30000); // Check every 30 seconds

    logger.info('Health check monitoring initialized');
  } catch (error) {
    logger.error('Error setting up health checks:', error);
  }
}; 