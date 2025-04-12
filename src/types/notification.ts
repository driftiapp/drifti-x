import { NotificationType } from './enums';

export interface NotificationData {
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  data: NotificationData;
  read: boolean;
  createdAt: Date;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification | Notification[];
  timestamp: Date;
} 