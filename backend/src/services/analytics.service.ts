import { AppError, ErrorCode } from '../utils/AppError';
import { logger, withPerformanceLogging } from '../utils/logger';
import { 
  IAnalyticsMetrics,
  IAnalyticsTrends,
  IUserAnalytics,
  analyticsMetricsSchema,
  analyticsTrendsSchema,
  userAnalyticsSchema
} from '../types/analytics';
import { OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { Types, Document } from 'mongoose';
import { Analytics, IAnalytics } from '../models/analytics.model';
import mongoose from 'mongoose';

/**
 * Interface for trend data
 * @interface ITrend
 */
interface ITrend {
  _id: string;
  count: number;
  amount?: number;
}

/**
 * Service class for handling analytics operations
 * Provides methods for fetching metrics, trends, and user analytics
 * @class AnalyticsService
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  /**
   * Get the singleton instance of AnalyticsService
   * @returns {AnalyticsService} The singleton instance
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get overall analytics metrics
   * @returns {Promise<IAnalyticsMetrics>} Analytics metrics including total orders, active users, revenue, and average order value
   * @throws {AppError} If metrics cannot be retrieved or validation fails
   */
  public async getMetrics(): Promise<IAnalyticsMetrics> {
    return withPerformanceLogging('AnalyticsService.getMetrics', async () => {
      try {
        logger.info('Fetching analytics metrics');

        const [metricsResult, activeUsers] = await Promise.all([
          OrderModel.aggregate([
            {
              $facet: {
                totalOrders: [{ $count: 'count' }],
                revenue: [
                  { $match: { paymentStatus: 'PAID' } },
                  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                ],
                averageOrder: [
                  { $match: { paymentStatus: 'PAID' } },
                  { $group: { _id: null, average: { $avg: '$totalAmount' } } }
                ]
              }
            }
          ]),
          UserModel.countDocuments({ isActive: true })
        ]);

        const metrics: IAnalyticsMetrics = {
          totalOrders: metricsResult[0]?.totalOrders[0]?.count || 0,
          activeUsers,
          revenue: metricsResult[0]?.revenue[0]?.total || 0,
          averageOrderValue: metricsResult[0]?.averageOrder[0]?.average || 0,
          timestamp: new Date().toISOString()
        };

        // Validate metrics
        try {
          analyticsMetricsSchema.parse(metrics);
        } catch (validationError) {
          logger.error('Metrics validation failed', { validationError, metrics });
          throw new AppError('Invalid metrics data', 400, {
            code: ErrorCode.VALIDATION_ERROR,
            context: { validationError, metrics }
          });
        }

        logger.info('Metrics fetched successfully', { metrics });
        return metrics;
      } catch (error) {
        logger.error('Failed to fetch metrics', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to fetch analytics metrics', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get analytics trends for a specific time period
   * @param {string} timePeriod - Time period for trends (default: '30d')
   * @returns {Promise<IAnalyticsTrends>} Analytics trends including order, revenue, and user trends
   * @throws {AppError} If trends cannot be retrieved or validation fails
   */
  public async getTrends(timePeriod: string = '30d'): Promise<IAnalyticsTrends> {
    return withPerformanceLogging('AnalyticsService.getTrends', async () => {
      try {
        logger.info('Fetching trends', { timePeriod });

        const startDate = this.calculateStartDate(timePeriod);
        const [trendsResult] = await OrderModel.aggregate([
          {
            $facet: {
              orderTrends: [
                {
                  $match: {
                    createdAt: { $gte: startDate }
                  }
                },
                {
                  $group: {
                    _id: {
                      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    date: '$_id',
                    count: 1
                  }
                }
              ],
              revenueTrends: [
                {
                  $match: {
                    createdAt: { $gte: startDate },
                    paymentStatus: 'PAID'
                  }
                },
                {
                  $group: {
                    _id: {
                      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    amount: { $sum: '$totalAmount' }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    date: '$_id',
                    amount: 1
                  }
                }
              ],
              userTrends: [
                {
                  $match: {
                    createdAt: { $gte: startDate }
                  }
                },
                {
                  $group: {
                    _id: {
                      $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    uniqueUsers: { $addToSet: '$userId' }
                  }
                },
                {
                  $project: {
                    _id: 0,
                    date: '$_id',
                    count: { $size: '$uniqueUsers' }
                  }
                }
              ]
            }
          }
        ]);

        const trends: IAnalyticsTrends = {
          orderTrends: trendsResult.orderTrends || [],
          revenueTrends: trendsResult.revenueTrends || [],
          userTrends: trendsResult.userTrends || [],
          timestamp: new Date().toISOString()
        };

        // Validate trends
        try {
          analyticsTrendsSchema.parse(trends);
        } catch (validationError) {
          logger.error('Trends validation failed', { validationError, trends });
          throw new AppError('Invalid trends data', 400, {
            code: ErrorCode.VALIDATION_ERROR,
            context: { validationError, trends }
          });
        }

        logger.info('Trends fetched successfully', { trends });
        return trends;
      } catch (error) {
        logger.error('Failed to fetch trends', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to fetch analytics trends', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Get analytics for a specific user
   * @param {string | Types.ObjectId} userId - User ID to get analytics for
   * @returns {Promise<IUserAnalytics>} User analytics including total orders, spending, and favorite service
   * @throws {AppError} If user analytics cannot be retrieved or validation fails
   */
  public async getUserAnalytics(userId: string | Types.ObjectId): Promise<IUserAnalytics> {
    return withPerformanceLogging('AnalyticsService.getUserAnalytics', async () => {
      try {
        logger.info('Fetching user analytics', { userId });

        if (!Types.ObjectId.isValid(userId)) {
          logger.warn('Invalid user ID provided', { userId });
          throw new AppError('Invalid user ID', 400, {
            code: ErrorCode.VALIDATION_ERROR,
            context: { userId }
          });
        }

        const [analyticsResult] = await OrderModel.aggregate([
          {
            $facet: {
              totalOrders: [
                { $match: { userId: new Types.ObjectId(userId) } },
                { $count: 'count' }
              ],
              totalSpent: [
                {
                  $match: {
                    userId: new Types.ObjectId(userId),
                    paymentStatus: 'PAID'
                  }
                },
                {
                  $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                  }
                }
              ],
              favoriteService: [
                {
                  $match: { userId: new Types.ObjectId(userId) }
                },
                {
                  $group: {
                    _id: '$serviceType',
                    count: { $sum: 1 }
                  }
                },
                {
                  $sort: { count: -1 }
                },
                {
                  $limit: 1
                }
              ]
            }
          }
        ]);

        const analytics: IUserAnalytics = {
          totalOrders: analyticsResult.totalOrders[0]?.count || 0,
          totalSpent: analyticsResult.totalSpent[0]?.total || 0,
          favoriteService: analyticsResult.favoriteService[0]?._id || null,
          timestamp: new Date().toISOString()
        };

        // Validate analytics
        try {
          userAnalyticsSchema.parse(analytics);
        } catch (validationError) {
          logger.error('User analytics validation failed', { validationError, analytics });
          throw new AppError('Invalid user analytics data', 400, {
            code: ErrorCode.VALIDATION_ERROR,
            context: { validationError, analytics }
          });
        }

        logger.info('User analytics fetched successfully', { userId, analytics });
        return analytics;
      } catch (error) {
        logger.error('Failed to fetch user analytics', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError('Failed to fetch user analytics', 500, {
          code: ErrorCode.DATABASE_ERROR,
          context: { error }
        });
      }
    });
  }

  /**
   * Calculate start date based on time period
   * @param {string} timePeriod - Time period string (e.g., '30d', '7d', '1y')
   * @returns {Date} Calculated start date
   * @throws {AppError} If time period is invalid
   */
  private calculateStartDate(timePeriod: string): Date {
    const now = new Date();
    const match = timePeriod.match(/^(\d+)([dmy])$/);
    
    if (!match) {
      logger.warn('Invalid time period format', { timePeriod });
      throw new AppError('Invalid time period format', 400, {
        code: ErrorCode.VALIDATION_ERROR,
        context: { timePeriod }
      });
    }

    const [_, amount, unit] = match;
    const numAmount = parseInt(amount, 10);

    switch (unit) {
      case 'd':
        return new Date(now.setDate(now.getDate() - numAmount));
      case 'm':
        return new Date(now.setMonth(now.getMonth() - numAmount));
      case 'y':
        return new Date(now.setFullYear(now.getFullYear() - numAmount));
      default:
        logger.warn('Invalid time unit', { unit });
        throw new AppError('Invalid time unit', 400, {
          code: ErrorCode.VALIDATION_ERROR,
          context: { unit }
        });
    }
  }

  // Track a new analytics event
  static async trackEvent(data: Partial<IAnalytics>): Promise<IAnalytics> {
    try {
      const analytics = new Analytics({
        ...data,
        timestamp: data.timestamp || new Date()
      });
      return await analytics.save();
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      throw error;
    }
  }

  // Get aggregated system stats
  static async getSystemStats(dateRange: string = 'last7days'): Promise<any> {
    try {
      const startDate = this.getDateRangeStart(dateRange);
      
      const [
        totalUsers,
        totalOrders,
        pageViews,
        activeUsersToday
      ] = await Promise.all([
        // Total users
        Analytics.distinct('userId').count(),
        
        // Total orders
        Analytics.countDocuments({ event: 'order_created' }),
        
        // Page views by page
        Analytics.aggregate([
          { $match: { event: 'page_view', timestamp: { $gte: startDate } } },
          { $group: { _id: '$metadata.page', count: { $sum: 1 } } }
        ]),
        
        // Active users today
        Analytics.distinct('userId', {
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).count()
      ]);

      return {
        totalUsers,
        totalOrders,
        pageViews: pageViews.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        activeUsersToday
      };
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  // Get analytics data with filters
  static async getAnalyticsData(params: {
    dateRange?: string;
    groupBy?: string;
    filter?: string;
    userId?: string;
  }): Promise<any> {
    try {
      const { dateRange, groupBy, filter, userId } = params;
      const startDate = dateRange ? this.getDateRangeStart(dateRange) : null;

      const matchStage: any = {};
      if (startDate) matchStage.timestamp = { $gte: startDate };
      if (userId) matchStage.userId = new mongoose.Types.ObjectId(userId);
      if (filter) {
        const [key, value] = filter.split(':');
        matchStage[`metadata.${key}`] = value;
      }

      const pipeline: any[] = [{ $match: matchStage }];

      if (groupBy) {
        pipeline.push({
          $group: {
            _id: `$${groupBy}`,
            count: { $sum: 1 },
            events: { $push: '$$ROOT' }
          }
        });
      }

      return await Analytics.aggregate(pipeline);
    } catch (error) {
      logger.error('Error getting analytics data:', error);
      throw error;
    }
  }

  // Helper function to get date range start
  private static getDateRangeStart(range: string): Date {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'yesterday':
        return new Date(now.setDate(now.getDate() - 1));
      case 'last7days':
        return new Date(now.setDate(now.getDate() - 7));
      case 'last30days':
        return new Date(now.setDate(now.getDate() - 30));
      default:
        return new Date(now.setDate(now.getDate() - 7)); // Default to last 7 days
    }
  }

  // Track page view
  static async trackPageView(userId: string | undefined, page: string): Promise<IAnalytics> {
    return this.trackEvent({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      event: 'page_view',
      metadata: { page }
    });
  }

  // Track click event
  static async trackClick(userId: string | undefined, button: string, page: string): Promise<IAnalytics> {
    return this.trackEvent({
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      event: 'click',
      metadata: { button, page }
    });
  }

  // Track system metric
  static async trackSystemMetric(metric: string, value: number, tags?: string[]): Promise<IAnalytics> {
    return this.trackEvent({
      event: 'system_metric',
      metadata: { metric },
      value,
      tags
    });
  }
} 