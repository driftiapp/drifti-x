import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError, UnauthorizedError, ValidationError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { withPerformanceLogging } from '../utils/logger';
import { IController } from '../types/controller';
import { ErrorType } from '../types/error';

export class AuthController implements IController {
  private static instance: AuthController;
  private service: AuthService;

  private constructor() {
    this.service = AuthService.getInstance();
  }

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  private getClientIp(req: Request): string {
    return req.ip || 
           req.headers['x-forwarded-for'] as string || 
           req.socket.remoteAddress || 
           'unknown';
  }

  public async signup(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('User signup', async () => {
      try {
        const user = await this.service.signup(req.body);
        res.status(201).json({
          success: true,
          data: user
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        logger.error('Error during signup:', { error, metadata: { ip: this.getClientIp(req) } });
        throw new ValidationError('Failed to create user', {
          metadata: {
            errorType: ErrorType.BUSINESS,
            timestamp: new Date(),
            ip: this.getClientIp(req)
          }
        });
      }
    });
  }

  public async login(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('User login', async () => {
      try {
        const { email, password, rememberDevice } = req.body;
        const result = await this.service.login(email, password, rememberDevice);
        res.status(200).json({
          success: true,
          data: result
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        logger.error('Error during login:', { error, metadata: { ip: this.getClientIp(req) } });
        throw new UnauthorizedError('Invalid credentials', {
          metadata: {
            errorType: ErrorType.SECURITY,
            timestamp: new Date(),
            ip: this.getClientIp(req)
          }
        });
      }
    });
  }

  public async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const { resetToken } = await this.service.requestPasswordReset(
        email,
        req.headers['user-agent'],
        this.getClientIp(req)
      );
      
      // TODO: Send reset email with resetToken
      logger.info(`Password reset token for ${email}: ${resetToken}`);
      
      res.json({ 
        message: 'If an account with that email exists, you will receive a password reset link.'
      });
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw error;
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const success = await this.service.resetPassword(
        token, 
        newPassword,
        req.headers['user-agent'],
        this.getClientIp(req)
      );
      
      if (success) {
        res.json({ message: 'Password reset successfully' });
      } else {
        throw new AppError('Invalid or expired reset token', 400);
      }
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  public async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        throw new AppError('Invalid verification token', 400);
      }

      const success = await this.service.verifyEmail(token);
      
      if (success) {
        res.json({ message: 'Email verified successfully' });
      } else {
        throw new AppError('Invalid or expired verification token', 400);
      }
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      const result = await this.service.refreshToken(token);
      res.json(result);
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  public async validateToken(req: Request, res: Response): Promise<void> {
    await withPerformanceLogging('Token validation', async () => {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        throw new UnauthorizedError('No token provided', {
          metadata: {
            errorType: ErrorType.SECURITY,
            timestamp: new Date(),
            ip: this.getClientIp(req)
          }
        });
      }

      try {
        const decoded = await this.service.validateToken(token);
        res.status(200).json({
          success: true,
          data: decoded
        });
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }
        logger.error('Error validating token:', { error, metadata: { ip: this.getClientIp(req) } });
        throw new UnauthorizedError('Invalid token', {
          metadata: {
            errorType: ErrorType.SECURITY,
            timestamp: new Date(),
            ip: this.getClientIp(req)
          }
        });
      }
    });
  }

  public async validateDeviceTrust(req: Request, res: Response): Promise<void> {
    try {
      const deviceTrustToken = req.cookies.device_trust;
      if (!deviceTrustToken) {
        res.json({ isValid: false });
        return;
      }

      const isValid = await this.service.validateDeviceTrust(
        deviceTrustToken,
        this.getClientIp(req)
      );

      res.json({ isValid });
    } catch (error) {
      logger.error('Error validating device trust:', error);
      throw error;
    }
  }
} 