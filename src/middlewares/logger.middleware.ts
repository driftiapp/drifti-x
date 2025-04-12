import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log the request
  console.log(`${req.method} ${req.url}`);

  // Capture response data
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res, duration);
  });

  next();
}; 