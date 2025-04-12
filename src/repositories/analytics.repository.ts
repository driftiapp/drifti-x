import mongoose from 'mongoose';
import { IAnalyticsMetrics, IAnalyticsTrends, IUserAnalytics } from '../types/analytics';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errorHandler';

// Define MongoDB schemas
const MetricsSchema = new mongoose.Schema({
  totalOrders: { type: Number, required: true, min: 0 },
  activeUsers: { type: Number, required: true, min: 0 },
  revenue: { type: Number, required: true, min: 0 },
  averageOrderValue: { type: Number, required: true, min: 0 },
  timestamp: { type: Date, required: true, default: Date.now }
});

const TrendPointSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  count: { type: Number, required: true, min: 0 },
  amount: { type: Number, min: 0 }
});

const TrendsSchema = new mongoose.Schema({
  orderTrends: [TrendPointSchema],
  revenueTrends: [TrendPointSchema],
  userTrends: [TrendPointSchema],
  timestamp: { type: Date, required: true, default: Date.now }
});

const UserAnalyticsSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  totalOrders: { type: Number, required: true, min: 0 },
  totalSpent: { type: Number, required: true, min: 0 },
  averageOrderValue: { type: Number, required: true, min: 0 },
  favoriteService: { type: String, required: true },
  lastOrderDate: { type: Date, required: true },
  timestamp: { type: Date, required: true, default: Date.now }
});

// Create MongoDB models
const Metrics = mongoose.model('Metrics', MetricsSchema);
const Trends = mongoose.model('Trends', TrendsSchema);
const UserAnalytics = mongoose.model('UserAnalytics', UserAnalyticsSchema);

export class AnalyticsRepository {
  private static instance: AnalyticsRepository;

  private constructor() {}

  public static getInstance(): AnalyticsRepository {
    if (!AnalyticsRepository.instance) {
      AnalyticsRepository.instance = new AnalyticsRepository();
    }
    return AnalyticsRepository.instance;
  }

  async getMetrics(): Promise<IAnalyticsMetrics> {
    const startTime = performance.now();
    logger.info('Fetching analytics metrics from database');

    try {
      const metrics = await Metrics.findOne().sort({ timestamp: -1 });
      
      if (!metrics) {
        throw new DatabaseError('No metrics data found', {
          context: { operation: 'getMetrics' },
          fingerprint: ['analytics', 'metrics', 'not_found']
        });
      }

      const result: IAnalyticsMetrics = {
        totalOrders: metrics.totalOrders,
        activeUsers: metrics.activeUsers,
        revenue: metrics.revenue,
        averageOrderValue: metrics.averageOrderValue,
        timestamp: metrics.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`Metrics fetched successfully in ${duration}ms`, { metrics: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to fetch analytics metrics from database', { error });
      throw new DatabaseError('Failed to fetch analytics metrics', {
        context: { operation: 'getMetrics', error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'metrics', 'database_error']
      });
    }
  }

  async getTrends(): Promise<IAnalyticsTrends> {
    const startTime = performance.now();
    logger.info('Fetching analytics trends from database');

    try {
      const trends = await Trends.findOne().sort({ timestamp: -1 });
      
      if (!trends) {
        throw new DatabaseError('No trends data found', {
          context: { operation: 'getTrends' },
          fingerprint: ['analytics', 'trends', 'not_found']
        });
      }

      const result: IAnalyticsTrends = {
        orderTrends: trends.orderTrends.map(t => ({
          date: t.date.toISOString().split('T')[0],
          count: t.count
        })),
        revenueTrends: trends.revenueTrends.map(t => ({
          date: t.date.toISOString().split('T')[0],
          amount: t.amount || 0 // Provide default value for null/undefined
        })),
        userTrends: trends.userTrends.map(t => ({
          date: t.date.toISOString().split('T')[0],
          count: t.count
        })),
        timestamp: trends.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`Trends fetched successfully in ${duration}ms`, { trends: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to fetch analytics trends from database', { error });
      throw new DatabaseError('Failed to fetch analytics trends', {
        context: { operation: 'getTrends', error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'trends', 'database_error']
      });
    }
  }

  async getUserAnalytics(userId: string): Promise<IUserAnalytics> {
    const startTime = performance.now();
    logger.info('Fetching user analytics from database', { userId });

    try {
      const userAnalytics = await UserAnalytics.findOne({ userId }).sort({ timestamp: -1 });
      
      if (!userAnalytics) {
        throw new DatabaseError('No user analytics found', {
          context: { operation: 'getUserAnalytics', userId },
          fingerprint: ['analytics', 'user', 'not_found']
        });
      }

      const result: IUserAnalytics = {
        userId: userAnalytics.userId,
        totalOrders: userAnalytics.totalOrders,
        totalSpent: userAnalytics.totalSpent,
        averageOrderValue: userAnalytics.averageOrderValue,
        favoriteService: userAnalytics.favoriteService,
        lastOrderDate: userAnalytics.lastOrderDate.toISOString().split('T')[0],
        timestamp: userAnalytics.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`User analytics fetched successfully in ${duration}ms`, { userAnalytics: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to fetch user analytics from database', { error, userId });
      throw new DatabaseError('Failed to fetch user analytics', {
        context: { operation: 'getUserAnalytics', userId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'user', 'database_error']
      });
    }
  }

  async updateMetrics(metrics: Omit<IAnalyticsMetrics, 'timestamp'>): Promise<IAnalyticsMetrics> {
    const startTime = performance.now();
    logger.info('Updating analytics metrics in database', { metrics });

    try {
      const newMetrics = new Metrics({
        ...metrics,
        timestamp: new Date()
      });

      await newMetrics.save();

      const result: IAnalyticsMetrics = {
        ...metrics,
        timestamp: newMetrics.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`Metrics updated successfully in ${duration}ms`, { metrics: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to update analytics metrics in database', { error, metrics });
      throw new DatabaseError('Failed to update analytics metrics', {
        context: { operation: 'updateMetrics', metrics, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'metrics', 'update_error']
      });
    }
  }

  async updateTrends(trends: Omit<IAnalyticsTrends, 'timestamp'>): Promise<IAnalyticsTrends> {
    const startTime = performance.now();
    logger.info('Updating analytics trends in database', { trends });

    try {
      const newTrends = new Trends({
        orderTrends: trends.orderTrends.map(t => ({
          date: new Date(t.date),
          count: t.count
        })),
        revenueTrends: trends.revenueTrends.map(t => ({
          date: new Date(t.date),
          amount: t.amount
        })),
        userTrends: trends.userTrends.map(t => ({
          date: new Date(t.date),
          count: t.count
        })),
        timestamp: new Date()
      });

      await newTrends.save();

      const result: IAnalyticsTrends = {
        ...trends,
        timestamp: newTrends.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`Trends updated successfully in ${duration}ms`, { trends: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to update analytics trends in database', { error, trends });
      throw new DatabaseError('Failed to update analytics trends', {
        context: { operation: 'updateTrends', trends, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'trends', 'update_error']
      });
    }
  }

  async updateUserAnalytics(userId: string, analytics: Omit<IUserAnalytics, 'userId' | 'timestamp'>): Promise<IUserAnalytics> {
    const startTime = performance.now();
    logger.info('Updating user analytics in database', { userId, analytics });

    try {
      const newUserAnalytics = new UserAnalytics({
        userId,
        ...analytics,
        lastOrderDate: new Date(analytics.lastOrderDate),
        timestamp: new Date()
      });

      await newUserAnalytics.save();

      const result: IUserAnalytics = {
        userId,
        ...analytics,
        timestamp: newUserAnalytics.timestamp.toISOString()
      };

      const duration = performance.now() - startTime;
      logger.info(`User analytics updated successfully in ${duration}ms`, { userAnalytics: result });

      return result;
    } catch (error: unknown) {
      logger.error('Failed to update user analytics in database', { error, userId, analytics });
      throw new DatabaseError('Failed to update user analytics', {
        context: { operation: 'updateUserAnalytics', userId, analytics, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['analytics', 'user', 'update_error']
      });
    }
  }
} 