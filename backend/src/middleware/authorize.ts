import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (!roles.includes(req.user.role)) {
        throw new AppError('Unauthorized access', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 