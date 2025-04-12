import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ValidationError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { UserRole } from '../types/user';
import { config } from '../config';
import { User } from '../models/user.model';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { IUser } from '../types/user';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | IUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ValidationError('No token provided', {
        context: { headers: req.headers },
        fingerprint: ['auth', 'token', 'missing']
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ValidationError('User not found', {
        context: { userId: decoded.id },
        fingerprint: ['auth', 'user', 'not-found']
      });
    }

    (req as AuthenticatedRequest).user = user;

    logger.debug('User authenticated', {
      userId: user._id,
      role: user.role
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ValidationError('Invalid token', {
        context: { error: error.message },
        fingerprint: ['auth', 'token', 'invalid']
      });
    }
    next(error);
  }
};

export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required', {
          context: { path: req.path },
          fingerprint: ['auth', 'role', 'unauthorized']
        });
      }

      const userRole = (req.user as IUser).role;
      if (!roles.includes(userRole)) {
        throw new ValidationError('Insufficient permissions', {
          context: { 
            path: req.path,
            userRole: userRole,
            requiredRoles: roles
          },
          fingerprint: ['auth', 'role', 'forbidden']
        });
      }

      logger.debug('User authorized', {
        userId: (req.user as IUser)._id,
        role: userRole,
        path: req.path
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}; 