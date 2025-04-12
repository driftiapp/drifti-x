import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming user role is attached to the request by auth middleware
    if (req.user?.role !== 'admin') {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user?.id,
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    logger.error('Admin middleware error', { error });
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 