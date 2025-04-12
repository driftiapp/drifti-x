import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export interface IWebSocketEvent {
  timestamp: Date;
  type: string;
  data: unknown;
}

export interface IWebSocketService {
  initialize: (server: Server) => void;
  stop: () => void;
  sendNotification: (notification: INotification) => void;
  broadcastToRoom: <T extends IWebSocketEvent>(room: string, event: string, data: T) => void;
  joinRoom: (socketId: string, room: string) => void;
  leaveRoom: (socketId: string, room: string) => void;
  getConnectedUsers: () => Map<string, string>;
}

export enum NotificationType {
  STATUS_UPDATE = 'status_update',
  LOCATION_UPDATE = 'location_update',
  PAYMENT_UPDATE = 'payment_update',
  RATING_UPDATE = 'rating_update',
  ORDER_UPDATE = 'order_update',
  DELIVERY_UPDATE = 'delivery_update',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_LOCATION = 'DRIVER_LOCATION',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION'
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number];
  timestamp: Date;
}

export interface INotificationData {
  previousStatus?: string;
  newStatus?: string;
  location?: ILocation;
  paymentStatus?: string;
  rating?: number;
  message?: string;
  orderId?: string;
  deliveryId?: string;
  metadata?: Record<string, unknown>;
}

export interface INotification {
  id: string;
  type: NotificationType;
  data: INotificationData;
  timestamp: Date;
  userIds: string[];
} 