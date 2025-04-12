import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  PaymentError,
  RideError,
  OrderError,
  FileUploadError,
  NotificationError,
  ChatError,
  LocationError,
  ExternalServiceError,
} from '../types/errors';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errors?: string[];
  service?: string;

  constructor(message: string, statusCode: number, errors?: string[], service?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    this.service = service;

    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  status: string;
  message: string;
  errors?: string[];
  service?: string;
  stack?: string;
  error?: Error;
}

const handleMongooseError = (err: any): AppError => {
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el: any) => el.message);
    return new AppError('Validation Error', 400, errors);
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Duplicate field value: ${field}`, 400);
  }

  // Handle cast errors
  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  return new AppError('Database Error', 500);
};

const createErrorResponse = (status: string, message: string, options: Partial<ErrorResponse> = {}): ErrorResponse => ({
  status,
  message,
  ...options,
});

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Handle custom errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(createErrorResponse(err.status, err.message, {
      errors: err.errors,
      service: err.service,
    }));
    return;
  }

  // Handle custom error types
  const errorHandlers: Record<string, (error: Error) => void> = {
    ValidationError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    AuthenticationError: (error) => res.status(401).json(createErrorResponse('fail', error.message)),
    AuthorizationError: (error) => res.status(403).json(createErrorResponse('fail', error.message)),
    NotFoundError: (error) => res.status(404).json(createErrorResponse('fail', error.message)),
    RateLimitError: (error) => res.status(429).json(createErrorResponse('fail', error.message)),
    ServiceUnavailableError: (error) => res.status(503).json(createErrorResponse('error', error.message)),
    PaymentError: (error) => res.status(402).json(createErrorResponse('fail', error.message)),
    RideError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    OrderError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    FileUploadError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    NotificationError: (error) => res.status(500).json(createErrorResponse('error', error.message)),
    ChatError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    LocationError: (error) => res.status(400).json(createErrorResponse('fail', error.message)),
    ExternalServiceError: (error) => res.status(502).json(createErrorResponse('error', error.message, {
      service: (error as ExternalServiceError).service,
    })),
  };

  const errorType = err.constructor.name;
  if (errorType in errorHandlers) {
    errorHandlers[errorType](err);
    return;
  }

  // Handle Mongoose errors
  const mongooseError = handleMongooseError(err);
  if (mongooseError instanceof AppError) {
    res.status(mongooseError.statusCode).json(createErrorResponse(
      mongooseError.status,
      mongooseError.message,
      { errors: mongooseError.errors },
    ));
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(createErrorResponse('fail', 'Invalid token. Please log in again!'));
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(createErrorResponse('fail', 'Your token has expired! Please log in again.'));
    return;
  }

  // Log the error in development
  if (config.nodeEnv === 'development') {
    console.error('Error 💥', err);
    res.status(500).json(createErrorResponse('error', err.message, {
      stack: err.stack,
      error: err,
    }));
    return;
  }

  // Send generic error in production
  res.status(500).json(createErrorResponse('error', 'Something went wrong!'));
}; 