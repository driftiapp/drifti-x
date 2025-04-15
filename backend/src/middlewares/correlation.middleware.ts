import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Extend Express Request type to include correlationId
 */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Middleware for adding correlation IDs to requests and responses
 * This helps in tracing requests across the system and debugging issues
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next function
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get correlation ID from header or generate new one
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    
    // Attach correlation ID to request
    req.correlationId = correlationId;
    
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    
    // Log request with correlation ID and additional context
    logger.info('Incoming request', {
      correlationId,
      method: req.method,
      path: req.path,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      query: req.query,
      timestamp: new Date().toISOString()
    });

    // Add response listener to log response status
    res.on('finish', () => {
      logger.debug('Request completed', {
        correlationId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: process.hrtime()[0],
        timestamp: new Date().toISOString()
      });
    });
    
    next();
  } catch (error) {
    logger.error('Error in correlation middleware', {
      error,
      path: req.path,
      method: req.method
    });
    next(error);
  }
}; 