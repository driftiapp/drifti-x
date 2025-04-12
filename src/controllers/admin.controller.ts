import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { config } from '../config';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/express';
import { IUserResponse, LeanUser } from '../types/user';
import { IErrorResponse } from '../types/error';
import { z } from 'zod';

// Validation schemas
const logLevelSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug'])
});

const roleSchema = z.object({
  role: z.enum(['user', 'admin', 'driver', 'merchant'])
});

// Helper functions
const toLeanUser = (user: any): LeanUser => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const createUserResponse = (user: LeanUser): IUserResponse => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
});

export const adminController = {
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-password');
      const leanUsers = users.map(user => createUserResponse(toLeanUser(user)));
      
      res.json({
        success: true,
        data: leanUsers
      });
    } catch (error) {
      logger.error('Failed to get all users', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  },

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: createUserResponse(toLeanUser(user))
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode
        } as IErrorResponse);
      } else {
        logger.error('Failed to get user by ID', { error });
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve user',
          error: error instanceof Error ? error.message : 'Unknown error'
        } as IErrorResponse);
      }
    }
  },

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = roleSchema.parse(req.body);

      const user = await User.findById(req.params.id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      user.role = role;
      await user.save();

      logger.info(`User role updated: ${user.email} -> ${role}`);

      res.json({
        success: true,
        data: createUserResponse(toLeanUser(user))
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode
        } as IErrorResponse);
      } else if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid role provided',
          error: error.errors
        } as IErrorResponse);
      } else {
        logger.error('Failed to update user role', { error });
        res.status(500).json({
          success: false,
          message: 'Failed to update user role',
          error: error instanceof Error ? error.message : 'Unknown error'
        } as IErrorResponse);
      }
    }
  },

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.deleteOne();
      logger.info(`User deleted: ${user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          status: error.statusCode
        } as IErrorResponse);
      } else {
        logger.error('Failed to delete user', { error });
        res.status(500).json({
          success: false,
          message: 'Failed to delete user',
          error: error instanceof Error ? error.message : 'Unknown error'
        } as IErrorResponse);
      }
    }
  },

  async updateLoggingLevel(req: Request, res: Response): Promise<void> {
    try {
      const { level } = logLevelSchema.parse(req.body);
      
      logger.level = level;
      
      res.json({
        success: true,
        message: `Log level updated to ${level}`,
        currentLevel: level
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid log level provided',
          error: error.errors
        } as IErrorResponse);
      } else {
        logger.error('Failed to update log level', { error });
        res.status(500).json({
          success: false,
          message: 'Failed to update log level',
          error: error instanceof Error ? error.message : 'Unknown error'
        } as IErrorResponse);
      }
    }
  },

  async getCurrentLogLevel(_req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        currentLevel: logger.level
      });
    } catch (error) {
      logger.error('Failed to get current log level', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current log level',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  },

  async getSystemStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        environment: config.nodeEnv,
        logLevel: logger.level,
        database: {
          connected: mongoose.connection.readyState === 1,
        },
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get system status', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system status',
        error: error instanceof Error ? error.message : 'Unknown error'
      } as IErrorResponse);
    }
  }
}; 