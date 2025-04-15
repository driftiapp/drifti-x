import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { auth } from '../middlewares/auth';
import liquorDeliveryRoutes from './liquorDelivery.routes';
import smokeShopRoutes from './smokeShop.routes';
import analyticsRoutes from './analytics.routes';
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import deviceRoutes from './device.routes';
import { setupWebSocket } from '../websockets';

const router = Router();

export const setupRoutes = (
  app: Express,
  io: SocketIOServer
): void => {
  // Health check route
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API routes with authentication
  app.use('/api/liquor-delivery', auth, liquorDeliveryRoutes);
  app.use('/api/smoke-shop', auth, smokeShopRoutes);
  app.use('/api/analytics', auth, analyticsRoutes);

  // API routes without authentication
  router.use('/auth', authRoutes);
  router.use('/users', userRoutes);
  router.use('/devices', deviceRoutes);

  // Mount the router
  app.use('/api', router);

  // WebSocket setup
  setupWebSocket(io);
};

export default router; 