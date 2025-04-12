import { AppError, DatabaseError, ValidationError } from '../utils/errorHandler';
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
import { User } from '../models/user.model';
import { Types } from 'mongoose';

interface ITrend {
  _id: string;
  count: number;
  amount?: number;
}

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async getMetrics(): Promise<IAnalyticsMetrics> {
    return withPerformanceLogging('getMetrics', async () => {
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
          User.countDocuments({ isActive: true })
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
          throw new ValidationError('Invalid metrics data', {
            context: {
              validationError,
              metrics
            },
            fingerprint: ['metrics-validation']
          });
        }

        logger.info('Metrics fetched successfully', { metrics });
        return metrics;
      } catch (error) {
        logger.error('Failed to fetch metrics', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new DatabaseError('Failed to fetch analytics metrics', {
          context: { error },
          fingerprint: ['metrics-database']
        });
      }
    });
  }

  public async getTrends(timePeriod: string = '30d'): Promise<IAnalyticsTrends> {
    return withPerformanceLogging('getTrends', async () => {
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
          throw new ValidationError('Invalid trends data', {
            context: {
              validationError,
              trends
            },
            fingerprint: ['trends-validation']
          });
        }

        logger.info('Trends fetched successfully', { trends });
        return trends;
      } catch (error) {
        logger.error('Failed to fetch trends', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new DatabaseError('Failed to fetch analytics trends', {
          context: { error },
          fingerprint: ['trends-database']
        });
      }
    });
  }

  public async getUserAnalytics(userId: string): Promise<IUserAnalytics> {
    return withPerformanceLogging('getUserAnalytics', async () => {
      try {
        logger.info('Fetching user analytics', { userId });

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
              averageOrder: [
                {
                  $match: {
                    userId: new Types.ObjectId(userId),
                    paymentStatus: 'PAID'
                  }
                },
                {
                  $group: {
                    _id: null,
                    average: { $avg: '$totalAmount' }
                  }
                }
              ],
              favoriteService: [
                { $match: { userId: new Types.ObjectId(userId) } },
                { $group: { _id: '$serviceType', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
              ],
              lastOrder: [
                { $match: { userId: new Types.ObjectId(userId) } },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
                { $project: { createdAt: 1 } }
              ]
            }
          }
        ]);

        const userAnalytics: IUserAnalytics = {
          userId,
          totalOrders: analyticsResult.totalOrders[0]?.count || 0,
          totalSpent: analyticsResult.totalSpent[0]?.total || 0,
          averageOrderValue: analyticsResult.averageOrder[0]?.average || 0,
          favoriteService: analyticsResult.favoriteService[0]?._id || 'none',
          lastOrderDate: analyticsResult.lastOrder[0]?.createdAt.toISOString() || new Date(0).toISOString(),
          timestamp: new Date().toISOString()
        };

        // Validate user analytics
        try {
          userAnalyticsSchema.parse(userAnalytics);
        } catch (validationError) {
          throw new ValidationError('Invalid user analytics data', {
            context: {
              validationError,
              userAnalytics
            },
            fingerprint: ['user-analytics-validation']
          });
        }

        logger.info('User analytics fetched successfully', { userAnalytics });
        return userAnalytics;
      } catch (error) {
        logger.error('Failed to fetch user analytics', { error });
        if (error instanceof AppError) {
          throw error;
        }
        throw new DatabaseError('Failed to fetch user analytics', {
          context: { error },
          fingerprint: ['user-analytics-database']
        });
      }
    });
  }

  private calculateStartDate(timePeriod: string): Date {
    const now = new Date();
    const match = timePeriod.match(/^(\d+)([dwm])$/);
    if (!match) {
      throw new ValidationError('Invalid time period format', {
        context: { timePeriod },
        fingerprint: ['time-period-validation']
      });
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 'd':
        return new Date(now.setDate(now.getDate() - numValue));
      case 'w':
        return new Date(now.setDate(now.getDate() - (numValue * 7)));
      case 'm':
        return new Date(now.setMonth(now.getMonth() - numValue));
      default:
        throw new ValidationError('Invalid time period unit', {
          context: { timePeriod },
          fingerprint: ['time-period-validation']
        });
    }
  }
}

export const analyticsService = AnalyticsService.getInstance(); 