import { Request, Response, NextFunction } from 'express';
import { UserRole, IUser } from '../types/user';
import { ForbiddenError, ErrorCode } from '../utils/AppError';
import { JwtPayload } from 'jsonwebtoken';

// Helper function to get user ID
const getUserId = (user: IUser | JwtPayload | undefined): string | undefined => {
  if (!user) return undefined;
  if ('_id' in user) return user._id.toString();
  if ('sub' in user) return user.sub;
  return undefined;
};

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new ForbiddenError('Access denied', {
          code: ErrorCode.FORBIDDEN,
          context: { 
            userRole,
            allowedRoles,
            userId: getUserId(req.user)
          },
          fingerprint: ['role', 'forbidden']
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}; 