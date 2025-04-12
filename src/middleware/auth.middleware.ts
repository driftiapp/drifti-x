import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { IUser } from '../types/user';
import { UnauthorizedError } from '../utils/AppError';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided', {
        code: 'AUTH_NO_TOKEN',
        context: { headers: req.headers },
        fingerprint: ['auth', 'no-token']
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as IUser;
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token', {
      code: 'AUTH_INVALID_TOKEN',
      context: { error },
      fingerprint: ['auth', 'invalid-token']
    }));
  }
}; 