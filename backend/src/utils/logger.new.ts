import { createLogger, format, transports } from 'winston';
import { ErrorCode } from '../types/error';
import { IConfig } from '../types/config';

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    colorize(),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

export const logError = (error: Error, statusCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR) => {
  logger.error(error.message, {
    error,
    statusCode,
    stack: error.stack
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarning = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export function withPerformanceLogging(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const methodName = propertyKey;
    
    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - start;
      logger.info(`Method ${methodName} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Method ${methodName} failed after ${duration}ms`, { error });
      throw error;
    }
  };

  return descriptor;
}

export { logger }; 