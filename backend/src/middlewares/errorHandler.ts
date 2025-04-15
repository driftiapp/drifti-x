import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: (err as any).errors,
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // Handle mongoose duplicate key errors
  if ((err as any).code === 11000) {
    return res.status(400).json({
      status: 'error',
      message: 'Duplicate field value entered',
      ...(isDevelopment && { stack: err.stack })
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
}; 