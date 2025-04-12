import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../utils/AppError';
import { Types } from 'mongoose';
import { 
  IWebSocketService, 
  INotification, 
  NotificationType,
  ILocation,
  INotificationData,
  IWebSocketEvent
} from '../types/websocket';

export class WebSocketService implements IWebSocketService {
  private static instance: WebSocketService;
  private io!: Server;
  private connectedUsers: Map<string, string>; // userId -> socketId
  private isInitialized: boolean = false;

  private constructor() {
    this.connectedUsers = new Map();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(httpServer: HttpServer): void {
    if (this.isInitialized) {
      logger.warn('WebSocket service already initialized');
      return;
    }

    try {
      this.io = new Server(httpServer, {
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
      });

      this.setupEventHandlers();
      this.isInitialized = true;
      logger.info('WebSocket service initialized successfully');
    } catch (error) {
      throw new AppError('Failed to initialize WebSocket service', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['WEBSOCKET_INIT_FAILED']
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.io) {
      throw new AppError('WebSocket service not initialized', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        fingerprint: ['WEBSOCKET_NOT_INITIALIZED']
      });
    }

    this.io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId as string;
      if (!userId) {
        throw new AppError('User ID is required', 400, {
          code: ErrorCode.BAD_REQUEST_ERROR,
          fingerprint: ['MISSING_USER_ID']
        });
      }

      this.connectedUsers.set(userId, socket.id);
      logger.info('User authenticated', { userId, socketId: socket.id });

      // Join user's personal room
      socket.join(`user:${userId}`);

      socket.on('disconnect', () => {
        socket.leave(`user:${userId}`);
        this.connectedUsers.delete(userId);
        logger.info('User disconnected', { userId, socketId: socket.id });
      });

      socket.on('error', (error) => {
        logger.error('Socket error', { error, socketId: socket.id });
      });
    });
  }

  public sendNotification(notification: INotification): void {
    if (!this.isInitialized) {
      logger.error('WebSocket service not initialized');
      throw new AppError('WebSocket service not initialized', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        fingerprint: ['WEBSOCKET_NOT_INITIALIZED']
      });
    }

    try {
      notification.userIds.forEach(userId => {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
          this.io.to(socketId).emit(notification.type, notification);
          logger.info('Notification sent', { 
            notificationId: notification.id,
            type: notification.type,
            userId,
            socketId 
          });
        } else {
          logger.warn('User not connected for notification', { 
            userId,
            notificationId: notification.id
          });
        }
      });
    } catch (error) {
      logger.error('Failed to send notification', { 
        error,
        notificationId: notification.id
      });
      throw new AppError('Failed to send notification', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_SEND_FAILED']
      });
    }
  }

  public broadcastToRoom<T extends IWebSocketEvent>(room: string, event: string, data: T): void {
    if (!this.isInitialized) {
      logger.error('WebSocket service not initialized');
      throw new AppError('WebSocket service not initialized', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        fingerprint: ['WEBSOCKET_NOT_INITIALIZED']
      });
    }

    try {
      this.io.to(room).emit(event, data);
      logger.info('Broadcast to room', { room, event });
    } catch (error) {
      logger.error('Failed to broadcast to room', { error, room, event });
      throw new AppError('Failed to broadcast to room', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['BROADCAST_FAILED']
      });
    }
  }

  public joinRoom(socketId: string, room: string): void {
    if (!this.isInitialized) {
      logger.error('WebSocket service not initialized');
      throw new AppError('WebSocket service not initialized', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        fingerprint: ['WEBSOCKET_NOT_INITIALIZED']
      });
    }

    try {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
        logger.info('Socket joined room', { socketId, room });
      }
    } catch (error) {
      logger.error('Failed to join room', { error, socketId, room });
      throw new AppError('Failed to join room', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['JOIN_ROOM_FAILED']
      });
    }
  }

  public leaveRoom(socketId: string, room: string): void {
    if (!this.isInitialized) {
      logger.error('WebSocket service not initialized');
      throw new AppError('WebSocket service not initialized', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        fingerprint: ['WEBSOCKET_NOT_INITIALIZED']
      });
    }

    try {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(room);
        logger.info('Socket left room', { socketId, room });
      }
    } catch (error) {
      logger.error('Failed to leave room', { error, socketId, room });
      throw new AppError('Failed to leave room', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['LEAVE_ROOM_FAILED']
      });
    }
  }

  public getConnectedUsers(): Map<string, string> {
    return new Map(this.connectedUsers);
  }

  public stop(): void {
    if (this.io) {
      this.io.close();
      this.isInitialized = false;
      logger.info('WebSocket service stopped');
    }
  }
} 