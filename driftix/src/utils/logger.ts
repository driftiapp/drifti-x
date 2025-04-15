import winston from 'winston';
import { format } from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { IUser } from '../types/user';
import { JwtPayload } from 'jsonwebtoken';

const { combine, timestamp, printf, colorize } = format;

/**
 * Custom format for logs
 */
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

/**
 * Main logger instance for application logs
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Performance logger instance for tracking operation durations
 */
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/performance.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * Helper function to get user ID from request
 */
const getUserId = (user: IUser | JwtPayload | undefined): string | undefined => {
  if (!user) return undefined;
  if ('_id' in user) return user._id.toString();
  if ('sub' in user) return user.sub;
  return undefined;
};

/**
 * Performance monitoring wrapper for async operations
 */
export const withPerformanceLogging = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    performanceLogger.info(`${operation} completed`, {
      operation,
      duration: duration.toFixed(2),
      status: 'success'
    });
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceLogger.error(`${operation} failed`, {
      operation,
      duration: duration.toFixed(2),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: getUserId(req.user)
    });
  });

  next();
}; 