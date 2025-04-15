import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../utils/AppError';
import { config } from '../config/config';
import { UserModel } from '../models/user.model';
import { LoginAttemptService } from './loginAttempt.service';
import { ActivityLogService } from './activityLog.service';
import { DeviceTrustService } from './deviceTrust.service';
import crypto from 'crypto';
import { IUser, IUserDocument } from '../types/user';

export interface IUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'staff' | 'user';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
}

export class AuthService {
  private static instance: AuthService;
  private userModel: typeof UserModel;
  private loginAttemptService: LoginAttemptService;
  private activityLogService: ActivityLogService;
  private deviceTrustService: DeviceTrustService;

  private constructor() {
    this.userModel = UserModel.getInstance();
    this.loginAttemptService = LoginAttemptService.getInstance();
    this.activityLogService = ActivityLogService.getInstance();
    this.deviceTrustService = DeviceTrustService.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async signup(email: string, password: string, role: 'admin' | 'staff' | 'user' = 'user'): Promise<{ user: IUser; verificationToken: string }> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      const user = await this.userModel.createUser({
        email,
        password: hashedPassword,
        role,
        isEmailVerified: false
      });

      await this.userModel.setEmailVerificationToken(user.id, verificationToken);

      return { user, verificationToken };
    } catch (error) {
      logger.error('Error during signup:', error);
      throw new AppError('Failed to create user', 500);
    }
  }

  public async login(
    email: string, 
    password: string, 
    userAgent?: string, 
    ip?: string,
    rememberDevice: boolean = false
  ): Promise<{ 
    token: string; 
    user: Omit<IUser, 'password'>;
    deviceTrustToken?: string;
  }> {
    try {
      // Check if account is locked
      const isLocked = await this.loginAttemptService.isAccountLocked(email);
      if (isLocked) {
        const remainingTime = await this.loginAttemptService.getLockoutTimeRemaining(email);
        throw new AppError(`Account locked. Please try again in ${remainingTime} seconds.`, 429);
      }

      const user = await this.userModel.findByEmail(email);
      if (!user) {
        await this.loginAttemptService.trackFailedAttempt(email);
        throw new AppError('Invalid credentials', 401);
      }

      if (!user.isEmailVerified) {
        throw new AppError('Email not verified', 403);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.loginAttemptService.trackFailedAttempt(email);
        throw new AppError('Invalid credentials', 401);
      }

      // Reset login attempts on successful login
      await this.loginAttemptService.resetAttempts(email);

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(
        payload,
        config.jwtSecret as jwt.Secret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      const { password: _, ...userWithoutPassword } = user;

      // Log successful login
      await this.activityLogService.logActivity({
        userId: user.id,
        action: 'login',
        details: 'User logged in successfully',
        ipAddress: ip,
        userAgent: userAgent
      });

      let deviceTrustToken;
      if (rememberDevice && userAgent && ip) {
        const deviceInfo = {
          deviceId: crypto.createHash('sha256').update(userAgent + ip).digest('hex'),
          deviceType: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          os: userAgent.split('(')[1]?.split(')')[0] || 'unknown',
          browser: userAgent.split('/')[0] || 'unknown',
          ip: ip
        };

        const deviceTrust = await this.deviceTrustService.createDeviceTrust(
          user.id,
          deviceInfo,
          true
        );

        deviceTrustToken = deviceTrust.token;
      }

      return { token, user: userWithoutPassword, deviceTrustToken };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  public async requestPasswordReset(email: string, userAgent?: string, ip?: string): Promise<{ resetToken: string }> {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      await this.userModel.setPasswordResetToken(user.id, resetToken);

      // Log password reset request
      await this.activityLogService.logActivity({
        userId: user.id,
        action: 'password_reset_request',
        details: 'User requested password reset',
        ipAddress: ip,
        userAgent: userAgent
      });

      return { resetToken };
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw error;
    }
  }

  public async resetPassword(token: string, newPassword: string, userAgent?: string, ip?: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const success = await this.userModel.resetPassword(token, hashedPassword);

      if (success) {
        const user = await this.userModel.findByResetToken(token);
        if (user) {
          // Log password reset
          await this.activityLogService.logActivity({
            userId: user.id,
            action: 'password_reset',
            details: 'User reset their password',
            ipAddress: ip,
            userAgent: userAgent
          });
        }
      }

      return success;
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  public async verifyEmail(token: string): Promise<boolean> {
    try {
      return await this.userModel.verifyEmail(token);
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  public async refreshToken(token: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret as jwt.Secret) as JwtPayload;
      const user = await this.userModel.findById(decoded.id);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      const newToken = jwt.sign(
        payload,
        config.jwtSecret as jwt.Secret,
        { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
      );

      return { token: newToken };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new AppError('Invalid token', 401);
    }
  }

  public async validateToken(token: string): Promise<{ isValid: boolean; user?: Omit<IUser, 'password'> }> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret as jwt.Secret) as JwtPayload;
      const user = await this.userModel.findById(decoded.id);
      
      if (!user) {
        return { isValid: false };
      }

      const { password: _, ...userWithoutPassword } = user;
      return { isValid: true, user: userWithoutPassword };
    } catch (error) {
      return { isValid: false };
    }
  }

  public async validateDeviceTrust(token: string, ip: string): Promise<boolean> {
    try {
      return await this.deviceTrustService.validateDeviceTrust(token, ip);
    } catch (error) {
      logger.error('Error validating device trust:', error);
      return false;
    }
  }
} 