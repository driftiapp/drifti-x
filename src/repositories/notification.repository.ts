import { AppError, DatabaseError, NotFoundError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';
import { 
  INotification, 
  NotificationType,
  NotificationChannel
} from '../types/notification';
import { Model } from 'mongoose';

export interface INotificationRepository {
  create(notification: Omit<INotification, 'id' | 'createdAt'>): Promise<INotification>;
  findById(id: string): Promise<INotification>;
  findByUserId(userId: string): Promise<INotification[]>;
  findByFilters(filters: {
    userId?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    read?: boolean;
  }): Promise<INotification[]>;
  markAsRead(id: string): Promise<INotification>;
  delete(id: string): Promise<void>;
}

export class NotificationRepository implements INotificationRepository {
  private static instance: NotificationRepository;
  private notificationModel: Model<INotification>;

  private constructor(notificationModel: Model<INotification>) {
    this.notificationModel = notificationModel;
  }

  public static getInstance(notificationModel: Model<INotification>): NotificationRepository {
    if (!NotificationRepository.instance) {
      NotificationRepository.instance = new NotificationRepository(notificationModel);
    }
    return NotificationRepository.instance;
  }

  public async create(notification: Omit<INotification, 'id' | 'createdAt'>): Promise<INotification> {
    try {
      logger.info('Creating notification in repository', { notification });
      
      const createdNotification = await this.notificationModel.create({
        ...notification,
        createdAt: new Date()
      });

      logger.info('Notification created successfully in repository', { id: createdNotification.id });
      return createdNotification.toObject();
    } catch (error) {
      logger.error('Failed to create notification in repository', { error });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to create notification', {
        context: {
          originalError: error,
          notification
        },
        fingerprint: ['notification-repository-create']
      });
    }
  }

  public async findById(id: string): Promise<INotification> {
    try {
      logger.info('Finding notification by ID', { id });
      
      const notification = await this.notificationModel.findById(id).lean();
      if (!notification) {
        throw new NotFoundError('Notification not found', {
          context: { id },
          fingerprint: ['notification-repository-find']
        });
      }

      logger.info('Notification found successfully', { id });
      return notification;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to find notification', { error, id });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find notification', {
        context: {
          originalError: error,
          id
        },
        fingerprint: ['notification-repository-find']
      });
    }
  }

  public async findByUserId(userId: string): Promise<INotification[]> {
    try {
      logger.info('Finding notifications by user ID', { userId });
      
      const notifications = await this.notificationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      logger.info('Notifications found successfully', { count: notifications.length });
      return notifications;
    } catch (error) {
      logger.error('Failed to find notifications by user ID', { error, userId });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find notifications by user ID', {
        context: {
          originalError: error,
          userId
        },
        fingerprint: ['notification-repository-find-user']
      });
    }
  }

  public async findByFilters(filters: {
    userId?: string;
    type?: NotificationType;
    channel?: NotificationChannel;
    read?: boolean;
  }): Promise<INotification[]> {
    try {
      logger.info('Finding notifications by filters', { filters });
      
      const query: any = {};
      if (filters.userId) query.userId = filters.userId;
      if (filters.type) query.type = filters.type;
      if (filters.channel) query.channel = filters.channel;
      if (typeof filters.read === 'boolean') query.read = filters.read;

      const notifications = await this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .lean();

      logger.info('Notifications found successfully by filters', { count: notifications.length });
      return notifications;
    } catch (error) {
      logger.error('Failed to find notifications by filters', { error, filters });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to find notifications by filters', {
        context: {
          originalError: error,
          filters
        },
        fingerprint: ['notification-repository-find-filters']
      });
    }
  }

  public async markAsRead(id: string): Promise<INotification> {
    try {
      logger.info('Marking notification as read', { id });
      
      const notification = await this.notificationModel
        .findByIdAndUpdate(
          id,
          { read: true },
          { new: true }
        )
        .lean();

      if (!notification) {
        throw new NotFoundError('Notification not found', {
          context: { id },
          fingerprint: ['notification-repository-mark-read']
        });
      }

      logger.info('Notification marked as read successfully', { id });
      return notification;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to mark notification as read', { error, id });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to mark notification as read', {
        context: {
          originalError: error,
          id
        },
        fingerprint: ['notification-repository-mark-read']
      });
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting notification', { id });
      
      const result = await this.notificationModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundError('Notification not found', {
          context: { id },
          fingerprint: ['notification-repository-delete']
        });
      }

      logger.info('Notification deleted successfully', { id });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Failed to delete notification', { error, id });
      Sentry.captureException(error);
      throw new DatabaseError('Failed to delete notification', {
        context: {
          originalError: error,
          id
        },
        fingerprint: ['notification-repository-delete']
      });
    }
  }
} 