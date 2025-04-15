import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/user.model';
import { sanitizeUser } from '../utils/user.utils';
import { logger } from '../utils/logger';

/**
 * Middleware to attach user response formatting
 */
export const attachUserResponse = (req: Request, res: Response, next: NextFunction) => {
  res.locals.formatUserResponse = (user: any, token?: string) => {
    const sanitizedUser = sanitizeUser(user);
    return {
      user: sanitizedUser,
      ...(token && { token })
    };
  };
  next();
};

/**
 * Middleware to require authentication
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verify(token, config.jwt.secret) as { id: string; role: string };

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token', 401));
    }
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (req.user.role !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Access denied', 403));
    }
  }
};

/**
 * Middleware to log user activity
 */
export const logUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.user?._id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
};

/**
 * Middleware to validate user input
 */
export const validateUserInput = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      next(new AppError('Invalid input data', 400));
    }
  };
};

/**
 * Middleware to handle pagination
 */
export const handlePagination = (req: Request, res: Response, next: NextFunction) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    skip
  };

  next();
};

/**
 * Middleware to handle sorting
 */
export const handleSorting = (req: Request, res: Response, next: NextFunction) => {
  const sortBy = req.query.sortBy as string || 'createdAt';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  req.sorting = {
    [sortBy]: sortOrder
  };

  next();
};

/**
 * Middleware to handle filtering
 */
export const handleFiltering = (req: Request, res: Response, next: NextFunction) => {
  const filter: any = {};
  
  // Add role filter if provided
  if (req.query.role) {
    filter.role = req.query.role;
  }

  // Add active status filter if provided
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  // Add search filter if provided
  if (req.query.search) {
    filter.$or = [
      { email: { $regex: req.query.search, $options: 'i' } },
      { firstName: { $regex: req.query.search, $options: 'i' } },
      { lastName: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  req.filter = filter;
  next();
}; 