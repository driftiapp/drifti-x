import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/AppError';

/**
 * Rate limiter configuration for API endpoints
 * Uses express-rate-limit to prevent abuse and ensure fair usage
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and metrics
    const skipPaths = ['/health', '/metrics'];
    return skipPaths.includes(req.path);
  },
  handler: (req, res) => {
    const error = new AppError('Rate limit exceeded', {
      statusCode: 429,
      context: {
        ip: req.ip,
        path: req.path,
        method: req.method
      },
      fingerprint: ['rate-limit', 'exceeded']
    });

    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers
    });

    res.status(429).json(error.toJSON());
  },
  onLimitReached: (req) => {
    logger.warn('Rate limit reached', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      headers: req.headers
    });
  }
}); 