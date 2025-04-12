import { Request, Response, NextFunction } from 'express';
import { config } from '../core/config/config';
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
  errors?: any[];
  service?: string;

  constructor(message: string, statusCode: number, errors?: any[], service?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;
    this.service = service;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleMongooseError = (err: any) => {
  const error = err;

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

  return error;
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Handle custom errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
      service: err.service,
    });
  }

  // Handle custom error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof RateLimitError) {
    return res.status(429).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof ServiceUnavailableError) {
    return res.status(503).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof PaymentError) {
    return res.status(402).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof RideError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof OrderError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof FileUploadError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof NotificationError) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof ChatError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof LocationError) {
    return res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }

  if (err instanceof ExternalServiceError) {
    return res.status(502).json({
      status: 'error',
      message: err.message,
      service: err.service,
    });
  }

  // Handle Mongoose errors
  const mongooseError = handleMongooseError(err);
  if (mongooseError instanceof AppError) {
    return res.status(mongooseError.statusCode).json({
      status: mongooseError.status,
      message: mongooseError.message,
      errors: mongooseError.errors,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token. Please log in again!',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your token has expired! Please log in again.',
    });
  }

  // Log the error in development
  if (config.nodeEnv === 'development') {
    console.error('Error 💥', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Send generic error in production
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};
