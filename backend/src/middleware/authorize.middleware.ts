import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Unauthorized', 403);
    }

    next();
  };
}; 