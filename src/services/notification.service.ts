import { AppError, ErrorCode } from '../utils/AppError';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';
import { NotificationModel } from '../models/notification.model';
import { WebSocketService } from '../websockets/websocket.service';
import { z } from 'zod';
import { INotification as IWsNotification, NotificationType as WsNotificationType } from '../types/websocket';

export interface INotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  ORDER = 'ORDER',
  DELIVERY = 'DELIVERY',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT'
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP'
}

const notificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  channel: z.nativeEnum(NotificationChannel),
  read: z.boolean().default(false)
});

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>,
    channel: NotificationChannel = NotificationChannel.IN_APP
  ): Promise<INotification> {
    try {
      const notificationData = {
        userId,
        type,
        message,
        data,
        channel,
        read: false
      };

      try {
        notificationSchema.parse(notificationData);
      } catch (validationError) {
        throw new AppError('Invalid notification data', 400, {
          code: ErrorCode.VALIDATION_ERROR,
          context: { validationError, data: notificationData },
          fingerprint: ['NOTIFICATION_VALIDATION_FAILED']
        });
      }

      const notification = await NotificationModel.create({
        userId: new Types.ObjectId(userId),
        type,
        message,
        data,
        channel,
        read: false
      });

      return notification;
    } catch (error) {
      throw new AppError('Failed to create notification', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_CREATION_FAILED']
      });
    }
  }

  public async getNotifications(
    userId: string,
    filters: {
      type?: NotificationType;
      channel?: NotificationChannel;
      read?: boolean;
    } = {}
  ): Promise<INotification[]> {
    try {
      const query: Record<string, unknown> = {
        userId: new Types.ObjectId(userId)
      };

      if (filters.type) query.type = filters.type;
      if (filters.channel) query.channel = filters.channel;
      if (filters.read !== undefined) query.read = filters.read;

      const notifications = await NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return notifications;
    } catch (error) {
      throw new AppError('Failed to fetch notifications', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_FETCH_FAILED']
      });
    }
  }

  public async markAsRead(notificationId: string): Promise<void> {
    try {
      await NotificationModel.findByIdAndUpdate(notificationId, { read: true });
    } catch (error) {
      throw new AppError('Failed to mark notification as read', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_MARK_READ_FAILED']
      });
    }
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    try {
      await NotificationModel.findByIdAndDelete(notificationId);
    } catch (error) {
      throw new AppError('Failed to delete notification', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_DELETION_FAILED']
      });
    }
  }

  public async dispatchNotification(
    userId: string,
    type: NotificationType,
    message: string,
    data?: Record<string, unknown>,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP]
  ): Promise<void> {
    try {
      for (const channel of channels) {
        const notification = await this.createNotification(
          userId,
          type,
          message,
          data,
          channel
        );

        // Dispatch to appropriate channel
        switch (channel) {
          case NotificationChannel.IN_APP:
            // Use WebSocket service to send real-time notification
            const wsService = WebSocketService.getInstance();
            const wsNotification: IWsNotification = {
              id: notification.id,
              type: WsNotificationType.SYSTEM_NOTIFICATION,
              data: {
                message: notification.message,
                ...notification.data
              },
              timestamp: new Date(),
              userIds: [userId]
            };
            wsService.sendNotification(wsNotification);
            break;
          case NotificationChannel.EMAIL:
            // TODO: Implement email notification
            break;
          case NotificationChannel.PUSH:
            // TODO: Implement push notification
            break;
          case NotificationChannel.SMS:
            // TODO: Implement SMS notification
            break;
          default:
            throw new AppError('Invalid notification channel', 400, {
              code: ErrorCode.VALIDATION_ERROR,
              context: { channel },
              fingerprint: ['INVALID_NOTIFICATION_CHANNEL']
            });
        }
      }
    } catch (error) {
      throw new AppError('Failed to dispatch notification', 500, {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        context: { error },
        fingerprint: ['NOTIFICATION_DISPATCH_FAILED']
      });
    }
  }
} 