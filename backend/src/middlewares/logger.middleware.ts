import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { performance } from 'perf_hooks';

/**
 * Middleware for logging HTTP requests and responses
 * Captures request details, timing information, and response status
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = performance.now();
  const requestId = req.headers['x-request-id'] || req.id;

  // Log request details
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'accept': req.headers.accept
    },
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Capture response data
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    // Log response details
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type'),
      timestamp: new Date().toISOString()
    });

    // Log detailed info for non-200 responses
    if (res.statusCode >= 400) {
      logger.warn('Request error', {
        requestId,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        body: req.body,
        headers: req.headers,
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
}; 