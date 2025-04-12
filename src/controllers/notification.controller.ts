import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { 
  INotificationResponse,
  INotification,
  NotificationType,
  NotificationChannel
} from '../types/notification';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user';
import { notificationService } from '../services/notification.service';
import { z } from 'zod';

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.unknown()).optional()
});

const getNotificationsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  read: z.boolean().optional()
});

class NotificationController {
  private static instance: NotificationController;

  private constructor() {}

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  private handleError(error: Error): AppError {
    logger.error('Notification operation failed', { error });
    
    if (error instanceof AppError) {
      return error;
    }
    
    return new AppError('Failed to process notification request', {
      context: { error },
      fingerprint: ['notification-operation-failed']
    });
  }

  private isNotificationResponse(data: unknown): data is INotification | INotification[] {
    return (
      (Array.isArray(data) && data.every(item => 'id' in item && 'type' in item)) ||
      (!Array.isArray(data) && 'id' in (data as object) && 'type' in (data as object))
    );
  }

  private createResponse(data: INotification | INotification[] | { message: string }): INotificationResponse | { success: true; data: { message: string }; timestamp: string } {
    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };

    if (this.isNotificationResponse(data)) {
      return response as INotificationResponse;
    }

    return response as { success: true; data: { message: string }; timestamp: string };
  }

  public createNotification = [
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        logger.info('Creating new notification', { body: req.body });
        const validatedData = createNotificationSchema.parse(req.body);
        
        const notification = await notificationService.createNotification(validatedData);
        await notificationService.dispatchNotification(notification);

        logger.info('Notification created and dispatched successfully', { notification });
        res.status(201).json(this.createResponse(notification));
      } catch (error: unknown) {
        next(this.handleError(error as Error));
      }
    }
  ];

  public getNotifications = [
    authorize([UserRole.ADMIN, UserRole.CUSTOMER]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const query = getNotificationsSchema.parse(req.query);
        logger.info('Fetching notifications', { query });

        const notifications = await notificationService.getNotifications(query);

        logger.info('Notifications fetched successfully', { count: notifications.length });
        res.status(200).json(this.createResponse(notifications));
      } catch (error: unknown) {
        next(this.handleError(error as Error));
      }
    }
  ];

  public markAsRead = [
    authorize([UserRole.ADMIN, UserRole.CUSTOMER]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        logger.info('Marking notification as read', { id });

        const notification = await notificationService.markAsRead(id);

        logger.info('Notification marked as read', { id });
        res.status(200).json(this.createResponse(notification));
      } catch (error: unknown) {
        next(this.handleError(error as Error));
      }
    }
  ];

  public deleteNotification = [
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        logger.info('Deleting notification', { id });

        await notificationService.deleteNotification(id);

        logger.info('Notification deleted successfully', { id });
        res.status(200).json(this.createResponse({
          message: `Notification ${id} deleted successfully`
        }));
      } catch (error: unknown) {
        next(this.handleError(error as Error));
      }
    }
  ];
}

export const notificationController = NotificationController.getInstance(); 