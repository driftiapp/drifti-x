import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { connectDB } from './config/database';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin.routes';
import rideshareRoutes from './routes/rideshare.routes';
import { foodDeliveryRoutes } from './routes/foodDelivery.routes';
import smokeShopRoutes from './routes/smokeShop.routes';
import { liquorDeliveryRoutes } from './routes/liquorDelivery.routes';
import { setupSwagger } from './config/swagger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketService } from './services/websocket.service';
import { rideTrackingMiddleware } from './middleware/rideTracking.middleware';

const app = express();
const httpServer = createServer(app);

// Initialize WebSocket service
WebSocketService.getInstance(httpServer);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(rideTrackingMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rideshare', rideshareRoutes);
app.use('/api/food-delivery', foodDeliveryRoutes);
app.use('/api/smoke-shop', smokeShopRoutes);
app.use('/api/liquor-delivery', liquorDeliveryRoutes);

// Swagger Documentation
setupSwagger(app);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 