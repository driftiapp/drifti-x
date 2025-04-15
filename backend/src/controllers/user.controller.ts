import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { generateAuthResponse } from '../utils/user.utils';
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  phoneVerificationSchema,
  roleUpdateSchema
} from '../schemas/user.schemas';
import { validateUserInput } from '../middleware/user.middleware';

export class UserController {
  /**
   * Register a new user
   */
  static register = [
    validateUserInput(createUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password, firstName, lastName, role, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
          throw new AppError('Email already registered', 409);
        }

        // Create new user
        const user = await UserModel.createUser({
          email,
          password,
          firstName,
          lastName,
          role,
          phoneNumber
        });

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // TODO: Send verification email

        // Generate auth response
        const authResponse = generateAuthResponse(user);

        res.status(201).json(authResponse);
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Login user
   */
  static login = [
    validateUserInput(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password } = req.body;

        // Find user by email
        const user = await UserModel.findByEmail(email);
        if (!user) {
          throw new AppError('Invalid credentials', 401);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new AppError('Invalid credentials', 401);
        }

        // Check if user is active
        if (!user.isActive) {
          throw new AppError('Account is deactivated', 403);
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate auth response
        const authResponse = generateAuthResponse(user);

        res.status(200).json(authResponse);
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Get current user profile
   */
  static getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json(res.locals.formatUserResponse(req.user));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  static updateProfile = [
    validateUserInput(updateUserSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AppError('User not found', 404);
        }

        const updates = req.body;
        const user = await UserModel.findByIdAndUpdate(
          req.user._id,
          updates,
          { new: true, runValidators: true }
        );

        if (!user) {
          throw new AppError('User not found', 404);
        }

        res.status(200).json(res.locals.formatUserResponse(user));
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Request password reset
   */
  static requestPasswordReset = [
    validateUserInput(passwordResetRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;

        const user = await UserModel.findByEmail(email);
        if (!user) {
          // Don't reveal if email exists
          return res.status(200).json({ message: 'Password reset email sent' });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // TODO: Send password reset email

        res.status(200).json({ message: 'Password reset email sent' });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Reset password
   */
  static resetPassword = [
    validateUserInput(passwordResetSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token, newPassword } = req.body;

        const success = await UserModel.resetPassword(token, newPassword);
        if (!success) {
          throw new AppError('Invalid or expired token', 400);
        }

        res.status(200).json({ message: 'Password reset successful' });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Verify email
   */
  static verifyEmail = [
    validateUserInput(emailVerificationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.body;

        const success = await UserModel.verifyEmail(token);
        if (!success) {
          throw new AppError('Invalid or expired token', 400);
        }

        res.status(200).json({ message: 'Email verified successfully' });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Verify phone number
   */
  static verifyPhone = [
    validateUserInput(phoneVerificationSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { phoneNumber, code } = req.body;

        // TODO: Implement phone verification logic
        // This would typically involve checking against a stored verification code

        res.status(200).json({ message: 'Phone number verified successfully' });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Update user role (admin only)
   */
  static updateRole = [
    validateUserInput(roleUpdateSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.params;
        const { role, reason } = req.body;

        const user = await UserModel.findByIdAndUpdate(
          userId,
          { role },
          { new: true, runValidators: true }
        );

        if (!user) {
          throw new AppError('User not found', 404);
        }

        // TODO: Log role change with reason

        res.status(200).json(res.locals.formatUserResponse(user));
      } catch (error) {
        next(error);
      }
    }
  ];
} 