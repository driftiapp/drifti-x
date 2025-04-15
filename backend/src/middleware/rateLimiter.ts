import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many analytics requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
    });
  },
}); 