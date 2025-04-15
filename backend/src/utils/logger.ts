import winston, { format } from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { IUser } from '../types/user';
import { JwtPayload } from 'jsonwebtoken';
import { AppError } from './AppError';
import { ErrorCode } from '../types/error';
import { ErrorType } from '../types/error';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * Log levels in order of severity
 * @enum {string}
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log metadata interface
 * @interface ILogMetadata
 */
export interface ILogMetadata {
  /** The operation being performed */
  operation?: string;
  /** The duration of the operation in milliseconds */
  duration?: number;
  /** The status of the operation */
  status?: 'success' | 'error' | 'warning' | number;
  /** Additional context about the log */
  context?: Record<string, unknown>;
  /** The user ID associated with the log */
  userId?: string;
  /** The IP address associated with the log */
  ip?: string;
  /** The user agent associated with the log */
  userAgent?: string;
  /** The error stack trace */
  stack?: string;
  /** The error message */
  error?: string;
  /** The HTTP method */
  method?: string;
  /** The URL */
  url?: string;
}

/**
 * Custom format for logs
 * @param {Object} info - The log information
 * @returns {string} The formatted log message
 */
const logFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (metadata.error) {
    const error = metadata.error;
    if (error instanceof AppError) {
      msg += `\n  Error Code: ${error.code}`;
      msg += `\n  Error Type: ${error.errorType}`;
      msg += `\n  Error Source: ${error.errorSource}`;
      if (error.metadata) {
        msg += `\n  Metadata: ${JSON.stringify(error.metadata)}`;
      }
    } else if (error instanceof Error) {
      msg += `\n  ${error.stack || error.message}`;
    } else {
      msg += `\n  ${String(error)}`;
    }
  }
  
  return msg;
});

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Main logger instance for application logs
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    })
  ]
});

// Add console transport in development
if (config.environment === 'development') {
  logger.add(new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

/**
 * Performance logger instance for tracking operation durations
 * @type {winston.Logger}
 */
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
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
 * @param user - The user object or JWT payload
 * @returns The user ID or undefined if not available
 */
const getUserId = (user: IUser | JwtPayload | undefined): string | undefined => {
  if (!user) return undefined;
  if ('_id' in user) return user._id.toString();
  if ('sub' in user) return user.sub;
  return undefined;
};

/**
 * Performance monitoring wrapper for async operations
 * @template T - The return type of the operation
 * @param operation - The name of the operation
 * @param fn - The async function to execute
 * @returns The result of the operation
 * @throws {Error} If the operation fails
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
    logger.error('Error occurred', {
      operation: 'error-handling',
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: ErrorType.TECHNICAL,
      timestamp: new Date(),
      severity: 'error'
    });
    throw error;
  }
};

/**
 * Request logging middleware
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The Express next function
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
      userId: getUserId(req.user),
      correlationId: req.headers['x-correlation-id']
    });
  });

  next();
};

/**
 * Error logging middleware
 * @param error - The error object
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The Express next function
 */
export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: getUserId(req.user),
    correlationId: req.headers['x-correlation-id']
  });
  next(error);
};

/**
 * Helper function to log unhandled rejections
 * @param reason - The rejection reason
 * @param promise - The rejected promise
 */
export const logUnhandledRejection = (reason: unknown, promise: Promise<unknown>): void => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : 'Unknown reason',
    stack: reason instanceof Error ? reason.stack : undefined,
    promise
  });
};

/**
 * Helper function to log uncaught exceptions
 * @param error - The uncaught exception
 */
export const logUncaughtException = (error: Error): void => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
};

/**
 * Logs a critical error and sends a notification
 * @param {string} message - The error message
 * @param {Error} error - The error object
 * @param {ILogMetadata} [metadata] - Additional metadata
 */
export const logCriticalError = (message: string, error: Error, metadata: ILogMetadata = {}): void => {
  const logMetadata: ILogMetadata = {
    error: error.message,
    stack: error.stack,
    ...metadata
  };

  logger.error(message, logMetadata);
  // TODO: Implement notification service integration
};

/**
 * Logs a warning message
 * @param {string} message - The warning message
 * @param {ILogMetadata} [metadata] - Additional metadata
 */
export const logWarning = (message: string, metadata: ILogMetadata = {}): void => {
  logger.warn(message, metadata);
};

/**
 * Logs an info message
 * @param {string} message - The info message
 * @param {ILogMetadata} [metadata] - Additional metadata
 */
export const logInfo = (message: string, metadata: ILogMetadata = {}): void => {
  logger.info(message, metadata);
};

/**
 * Logs a debug message
 * @param {string} message - The debug message
 * @param {ILogMetadata} [metadata] - Additional metadata
 */
export const logDebug = (message: string, metadata: ILogMetadata = {}): void => {
  logger.debug(message, metadata);
};

// Helper to get caller module name
const getCallerModule = () => {
  const stack = new Error().stack;
  if (!stack) return 'unknown';
  const stackLines = stack.split('\n');
  const callerLine = stackLines[3]; // Adjust based on your stack trace depth
  const match = callerLine.match(/at\s+.*\s+\((.*):\d+:\d+\)/);
  return match ? match[1] : 'unknown';
};

// Context interface for logging
interface LogContext {
  requestId?: string;
  userId?: string;
  module?: string;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, any>;
}

// Create a logger with context
export const createLogger = (context: LogContext = {}) => {
  const requestId = context.requestId || uuidv4();
  const module = context.module || getCallerModule();

  return {
    info: (message: string, metadata?: Record<string, any>) => {
      logger.info(message, {
        ...context,
        ...metadata,
        requestId,
        module
      });
    },
    error: (message: string, error?: Error, metadata?: Record<string, any>) => {
      logger.error(message, {
        ...context,
        ...metadata,
        requestId,
        module,
        error: error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      });
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      logger.warn(message, {
        ...context,
        ...metadata,
        requestId,
        module
      });
    },
    debug: (message: string, metadata?: Record<string, any>) => {
      logger.debug(message, {
        ...context,
        ...metadata,
        requestId,
        module
      });
    }
  };
};

// Specialized error logging functions
export const logAuthError = (userId: string, message: string, metadata?: Record<string, any>) => {
  const logger = createLogger({ userId });
  logger.error(message, undefined, {
    ...metadata,
    errorType: ErrorType.SECURITY,
    timestamp: new Date(),
    severity: 'error'
  });
};

export const logValidationError = (field: string, message: string, metadata?: Record<string, any>) => {
  const logger = createLogger();
  logger.error(message, undefined, {
    ...metadata,
    field,
    errorType: ErrorType.BUSINESS,
    timestamp: new Date(),
    severity: 'error'
  });
};

export const logSystemCrash = (error: Error) => {
  const logger = createLogger();
  logger.error('System crash detected', error, {
    errorType: ErrorType.TECHNICAL,
    timestamp: new Date(),
    severity: 'critical'
  });
};

// Update the error factory methods
export const createAuthError = (message: string, code: ErrorCode = ErrorCode.INVALID_CREDENTIALS) => {
  return new AppError(code, message);
};

export const createValidationError = (message: string, code: ErrorCode = ErrorCode.INVALID_VALUE) => {
  return new AppError(code, message);
};

export const createSystemError = (message: string, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR) => {
  return new AppError(message, code, {
    errorType: ErrorType.TECHNICAL,
    errorSource: 'system',
    metadata: {
      timestamp: new Date(),
      severity: 'critical'
    }
  });
};

// Export default logger instance
export { logger }; 