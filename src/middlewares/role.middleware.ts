import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { UserRole } from '../types/user';
import { ValidationError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

export const roleMiddleware = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required', {
          context: { path: req.path },
          fingerprint: ['auth', 'role', 'unauthorized']
        });
      }

      const user = await User.findById(req.user._id);
      
      if (!user) {
        throw new ValidationError('User not found', {
          context: { userId: req.user._id },
          fingerprint: ['auth', 'user', 'not-found']
        });
      }

      if (!user.isActive) {
        throw new ValidationError('User account is deactivated', {
          context: { userId: user._id },
          fingerprint: ['auth', 'user', 'deactivated']
        });
      }

      if (!roles.includes(user.role)) {
        throw new ValidationError('Access denied. Insufficient permissions.', {
          context: { 
            path: req.path,
            userRole: user.role,
            requiredRoles: roles
          },
          fingerprint: ['auth', 'role', 'forbidden']
        });
      }

      logger.debug('Role check passed', {
        userId: user._id,
        role: user.role,
        path: req.path
      });

      req.user.role = user.role;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}; 