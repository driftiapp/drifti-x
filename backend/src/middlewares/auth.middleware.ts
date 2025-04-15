import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { UserRole } from '../types/user';
import { config } from '../config';
import { User } from '../models/user.model';
import { AuthenticatedRequest } from '../types/express';
import { IUser } from '../types/user';

/**
 * JWT payload interface representing the decoded token data
 */
interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Extend Express Request type to include user property
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | IUser;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Verifies the token and attaches the user to the request object
 * 
 * @throws {ValidationError} If token is missing, invalid, or user not found
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn('Authentication attempt without token', {
        headers: req.headers,
        path: req.path
      });
      throw new ValidationError('No token provided', {
        context: { headers: req.headers },
        fingerprint: ['auth', 'token', 'missing'],
        code: 'AUTH_NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      logger.warn('Authentication attempt with expired token', {
        userId: decoded.id,
        exp: decoded.exp
      });
      throw new ValidationError('Token expired', {
        context: { userId: decoded.id },
        fingerprint: ['auth', 'token', 'expired'],
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      logger.warn('Authentication attempt with non-existent user', {
        userId: decoded.id
      });
      throw new ValidationError('User not found', {
        context: { userId: decoded.id },
        fingerprint: ['auth', 'user', 'not-found'],
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    (req as AuthenticatedRequest).user = user;

    logger.debug('User authenticated successfully', {
      userId: user._id,
      role: user.role,
      path: req.path
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Authentication attempt with invalid token', {
        error: error.message
      });
      throw new ValidationError('Invalid token', {
        context: { error: error.message },
        fingerprint: ['auth', 'token', 'invalid'],
        code: 'AUTH_INVALID_TOKEN'
      });
    }
    next(error);
  }
};

/**
 * Middleware factory to authorize requests based on user roles
 * 
 * @param roles - Array of allowed user roles
 * @returns Middleware function that checks if user has required role
 * 
 * @throws {ValidationError} If user is not authenticated or lacks required role
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('Authorization attempt without authentication', {
          path: req.path
        });
        throw new ValidationError('Authentication required', {
          context: { path: req.path },
          fingerprint: ['auth', 'role', 'unauthorized'],
          code: 'AUTH_REQUIRED'
        });
      }

      const userRole = (req.user as IUser).role;
      if (!roles.includes(userRole)) {
        logger.warn('Authorization attempt with insufficient permissions', {
          userId: (req.user as IUser)._id,
          userRole,
          requiredRoles: roles,
          path: req.path
        });
        throw new ValidationError('Insufficient permissions', {
          context: { 
            path: req.path,
            userRole,
            requiredRoles: roles
          },
          fingerprint: ['auth', 'role', 'forbidden'],
          code: 'AUTH_INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.debug('User authorized successfully', {
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