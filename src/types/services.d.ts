import { Request, Response } from 'express';

export interface AuthService {
  register: (req: Request, res: Response) => Promise<void>;
  login: (req: Request, res: Response) => Promise<void>;
  logout: (req: Request, res: Response) => Promise<void>;
  refreshToken: (req: Request, res: Response) => Promise<void>;
}

export interface UserService {
  getProfile: (req: Request, res: Response) => Promise<void>;
  updateProfile: (req: Request, res: Response) => Promise<void>;
  deleteProfile: (req: Request, res: Response) => Promise<void>;
}

export interface ChatService {
  createChat: (req: Request, res: Response) => Promise<void>;
  getChats: (req: Request, res: Response) => Promise<void>;
  getChatMessages: (req: Request, res: Response) => Promise<void>;
  sendMessage: (req: Request, res: Response) => Promise<void>;
}

export interface NotificationService {
  getNotifications: (req: Request, res: Response) => Promise<void>;
  markAsRead: (req: Request, res: Response) => Promise<void>;
  deleteNotification: (req: Request, res: Response) => Promise<void>;
}

export interface UploadService {
  uploadFile: (req: Request, res: Response) => Promise<void>;
  deleteFile: (req: Request, res: Response) => Promise<void>;
}

export interface ErrorContext {
  context?: string;
  level?: 'info' | 'warning' | 'error' | 'fatal';
  path?: string;
  method?: string;
  extra?: Record<string, any>;
}

export interface ErrorService {
  captureError(error: Error, context?: ErrorContext): void;
}

declare const errorService: ErrorService;
export { errorService }; 