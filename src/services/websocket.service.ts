import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';

export interface IRideNotification {
  rideId: string;
  type: 'status_update' | 'location_update' | 'payment_update' | 'rating_update';
  data: {
    previousStatus?: string;
    newStatus?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
    paymentStatus?: string;
    rating?: number;
    message?: string;
  };
  timestamp: string;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server;
  private connectedUsers: Map<string, string>; // userId -> socketId

  private constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
    this.connectedUsers = new Map();
    this.setupEventHandlers();
  }

  public static getInstance(httpServer?: HttpServer): WebSocketService {
    if (!WebSocketService.instance && httpServer) {
      WebSocketService.instance = new WebSocketService(httpServer);
    }
    return WebSocketService.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('New client connected', { socketId: socket.id });

      // Handle user authentication
      socket.on('authenticate', (userId: string) => {
        this.connectedUsers.set(userId, socket.id);
        logger.info('User authenticated', { userId, socketId: socket.id });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = Array.from(this.connectedUsers.entries())
          .find(([_, socketId]) => socketId === socket.id)?.[0];
        
        if (userId) {
          this.connectedUsers.delete(userId);
          logger.info('User disconnected', { userId, socketId: socket.id });
        }
      });
    });
  }

  public sendRideNotification(notification: IRideNotification, userId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('ride_update', notification);
      logger.info('Ride notification sent', { notification, userId, socketId });
    } else {
      logger.warn('User not connected for notification', { userId });
    }
  }

  public broadcastRideUpdate(notification: IRideNotification, userIds: string[]) {
    userIds.forEach(userId => this.sendRideNotification(notification, userId));
  }

  public getConnectedUsers(): Map<string, string> {
    return new Map(this.connectedUsers);
  }
} 