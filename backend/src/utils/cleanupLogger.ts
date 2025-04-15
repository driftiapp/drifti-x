import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config/config';
import chalk from 'chalk';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format for console output with colors
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const levelColor = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.blue,
    debug: chalk.gray
  }[level] || chalk.white;

  const time = chalk.gray(`[${timestamp}]`);
  const levelText = levelColor(`[${level.toUpperCase()}]`);
  let msg = `${time} ${levelText}: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += `\n${chalk.gray(JSON.stringify(metadata, null, 2))}`;
  }

  return msg;
});

// Custom format for file output
const fileFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata
  });
});

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    fileFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    }),
    // Daily rotate file transport
    new winston.transports.DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'cleanup-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: config.cleanup.logRotation.maxSize,
      maxFiles: config.cleanup.logRotation.maxFiles,
      format: combine(
        timestamp(),
        fileFormat
      )
    })
  ]
});

// Helper methods for different log levels with enhanced formatting
export const cleanupLogger = {
  info: (message: string, metadata?: any) => {
    logger.info(message, { ...metadata, type: 'cleanup' });
  },
  warn: (message: string, metadata?: any) => {
    logger.warn(message, { ...metadata, type: 'cleanup' });
  },
  error: (message: string, metadata?: any) => {
    logger.error(message, { ...metadata, type: 'cleanup' });
  },
  debug: (message: string, metadata?: any) => {
    logger.debug(message, { ...metadata, type: 'cleanup' });
  },
  // Special methods for specific events
  fileChange: (path: string, action: 'added' | 'changed' | 'removed') => {
    const actionColor = {
      added: chalk.green,
      changed: chalk.yellow,
      removed: chalk.red
    }[action];
    
    logger.info(`File ${action}: ${path}`, {
      type: 'fileChange',
      action,
      path
    });
  },
  cleanupStart: () => {
    logger.info('Starting cleanup cycle', { type: 'cleanupStart' });
  },
  cleanupComplete: (results: any) => {
    logger.info('Cleanup cycle completed', {
      type: 'cleanupComplete',
      ...results
    });
  },
  errorDetected: (error: any, context?: string) => {
    logger.error(`Error detected${context ? ` in ${context}` : ''}`, {
      type: 'error',
      error: error.stack || error.message || error,
      context
    });
  }
};

// Export the logger instance for direct access if needed
export default logger; 