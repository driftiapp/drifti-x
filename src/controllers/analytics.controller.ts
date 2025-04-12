import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { IAnalyticsResponse, IAnalyticsMetrics, IAnalyticsTrends, IUserAnalytics } from '../types/analytics';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user';
import { analyticsService } from '../services/analytics.service';
import { z } from 'zod';

// Validation schemas
const timePeriodSchema = z.string().regex(/^\d+[dwm]$/).default('30d');
const userIdSchema = z.string().uuid();

class AnalyticsController {
  private static instance: AnalyticsController;

  private constructor() {}

  public static getInstance(): AnalyticsController {
    if (!AnalyticsController.instance) {
      AnalyticsController.instance = new AnalyticsController();
    }
    return AnalyticsController.instance;
  }

  private handleError(error: unknown): AppError {
    if (error instanceof AppError) {
      logger.error('Analytics operation failed', { 
        error: error.message,
        context: error.context,
        fingerprint: error.fingerprint
      });
      return error;
    }
    
    if (error instanceof z.ZodError) {
      logger.error('Analytics validation failed', { 
        error: error.errors,
        issues: error.issues
      });
      return new AppError('Invalid analytics request parameters', {
        context: { validationErrors: error.errors },
        fingerprint: ['analytics-validation-failed'],
        statusCode: 400
      });
    }
    
    logger.error('Unexpected analytics error', { error });
    return new AppError('Failed to process analytics request', {
      context: { error },
      fingerprint: ['analytics-operation-failed'],
      statusCode: 500
    });
  }

  private createResponse<T extends IAnalyticsMetrics | IAnalyticsTrends | IUserAnalytics>(
    data: T,
    message: string = 'Analytics data retrieved successfully'
  ): IAnalyticsResponse & { message: string } {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  public getMetrics = [
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        logger.info('Fetching analytics metrics');
        const metrics = await analyticsService.getMetrics();
        logger.info('Metrics fetched successfully', { metrics });
        res.status(200).json(this.createResponse(metrics, 'Analytics metrics retrieved successfully'));
      } catch (error) {
        next(this.handleError(error));
      }
    }
  ];

  public getTrends = [
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const timePeriod = timePeriodSchema.parse(req.query.timePeriod);
        logger.info('Fetching analytics trends', { timePeriod });
        const trends = await analyticsService.getTrends(timePeriod);
        logger.info('Trends fetched successfully', { trends });
        res.status(200).json(this.createResponse(trends, `Analytics trends for period ${timePeriod} retrieved successfully`));
      } catch (error) {
        next(this.handleError(error));
      }
    }
  ];

  public getUserAnalytics = [
    authorize([UserRole.ADMIN]),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = userIdSchema.parse(req.params.userId);
        logger.info('Fetching user analytics', { userId });
        const userAnalytics = await analyticsService.getUserAnalytics(userId);
        logger.info('User analytics fetched successfully', { userAnalytics });
        res.status(200).json(this.createResponse(userAnalytics, `Analytics for user ${userId} retrieved successfully`));
      } catch (error) {
        next(this.handleError(error));
      }
    }
  ];
}

export const analyticsController = AnalyticsController.getInstance(); 