import { Types } from 'mongoose';
import { analyticsService } from '../../src/services/analytics.service';
import { OrderModel } from '../../src/models/order.model';
import { User } from '../../src/models/user.model';
import { AppError, DatabaseError, ValidationError } from '../../src/utils/errorHandler';
import { logger } from '../../src/utils/logger';
import { IAnalyticsMetrics, IAnalyticsTrends, IUserAnalytics } from '../../src/types/analytics';

// Mock dependencies
jest.mock('../../src/models/order.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/logger');
jest.mock('@sentry/node');

describe('AnalyticsService', () => {
  beforeEach((): void => {
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    const mockMetricsResult = [{
      totalOrders: [{ count: 100 }],
      revenue: [{ total: 5000 }],
      averageOrder: [{ average: 50 }]
    }];

    beforeEach((): void => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue(mockMetricsResult);
      (User.countDocuments as jest.Mock).mockResolvedValue(50);
    });

    it('should return metrics successfully', async (): Promise<void> => {
      const result: IAnalyticsMetrics = await analyticsService.getMetrics();

      expect(result).toEqual({
        totalOrders: 100,
        activeUsers: 50,
        revenue: 5000,
        averageOrderValue: 50,
        timestamp: expect.any(String)
      });

      expect(OrderModel.aggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $facet: expect.objectContaining({
            totalOrders: expect.any(Array),
            revenue: expect.any(Array),
            averageOrder: expect.any(Array)
          })
        })
      ]);
      expect(User.countDocuments).toHaveBeenCalledWith({ isActive: true });
      expect(logger.info).toHaveBeenCalledWith('Fetching analytics metrics');
    });

    it('should handle empty aggregate results', async (): Promise<void> => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue([{}]);

      const result: IAnalyticsMetrics = await analyticsService.getMetrics();

      expect(result).toEqual({
        totalOrders: 0,
        activeUsers: 50,
        revenue: 0,
        averageOrderValue: 0,
        timestamp: expect.any(String)
      });
    });

    it('should handle database errors', async (): Promise<void> => {
      const error = new Error('Database error');
      (OrderModel.aggregate as jest.Mock).mockRejectedValue(error);

      await expect(analyticsService.getMetrics()).rejects.toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch metrics', 
        expect.objectContaining({ error })
      );
    });
  });

  describe('getTrends', () => {
    const mockTrendsResult = [{
      orderTrends: [{ date: '2024-03-15', count: 10 }],
      revenueTrends: [{ date: '2024-03-15', amount: 500 }],
      userTrends: [{ date: '2024-03-15', count: 5 }]
    }];

    beforeEach((): void => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue(mockTrendsResult);
    });

    it('should return trends with default time period', async (): Promise<void> => {
      const result: IAnalyticsTrends = await analyticsService.getTrends();

      expect(result).toEqual({
        orderTrends: [{ date: '2024-03-15', count: 10 }],
        revenueTrends: [{ date: '2024-03-15', amount: 500 }],
        userTrends: [{ date: '2024-03-15', count: 5 }],
        timestamp: expect.any(String)
      });

      expect(OrderModel.aggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $facet: expect.objectContaining({
            orderTrends: expect.any(Array),
            revenueTrends: expect.any(Array),
            userTrends: expect.any(Array)
          })
        })
      ]);
    });

    it('should return trends with custom time period', async (): Promise<void> => {
      await analyticsService.getTrends('7d');

      expect(OrderModel.aggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $facet: expect.objectContaining({
            orderTrends: expect.arrayContaining([
              expect.objectContaining({
                $match: expect.objectContaining({
                  createdAt: expect.any(Object)
                })
              })
            ])
          })
        })
      ]);
    });

    it('should handle empty aggregate results', async (): Promise<void> => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue([{}]);

      const result: IAnalyticsTrends = await analyticsService.getTrends();

      expect(result).toEqual({
        orderTrends: [],
        revenueTrends: [],
        userTrends: [],
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid time period', async (): Promise<void> => {
      await expect(analyticsService.getTrends('invalid')).rejects.toThrow(ValidationError);
    });

    it('should handle database errors', async (): Promise<void> => {
      const error = new Error('Database error');
      (OrderModel.aggregate as jest.Mock).mockRejectedValue(error);

      await expect(analyticsService.getTrends()).rejects.toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch trends', 
        expect.objectContaining({ error })
      );
    });
  });

  describe('getUserAnalytics', () => {
    const userId = 'user123';
    const mockAnalyticsResult = [{
      totalOrders: [{ count: 50 }],
      totalSpent: [{ total: 2500 }],
      averageOrder: [{ average: 50 }],
      favoriteService: [{ _id: 'rideshare', count: 30 }],
      lastOrder: [{ createdAt: new Date('2024-03-15T00:00:00.000Z') }]
    }];

    beforeEach((): void => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue(mockAnalyticsResult);
    });

    it('should return user analytics successfully', async (): Promise<void> => {
      const result: IUserAnalytics = await analyticsService.getUserAnalytics(userId);

      expect(result).toEqual({
        userId,
        totalOrders: 50,
        totalSpent: 2500,
        averageOrderValue: 50,
        favoriteService: 'rideshare',
        lastOrderDate: '2024-03-15T00:00:00.000Z',
        timestamp: expect.any(String)
      });

      expect(OrderModel.aggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $facet: expect.objectContaining({
            totalOrders: expect.any(Array),
            totalSpent: expect.any(Array),
            averageOrder: expect.any(Array),
            favoriteService: expect.any(Array),
            lastOrder: expect.any(Array)
          })
        })
      ]);
    });

    it('should handle empty aggregate results', async (): Promise<void> => {
      (OrderModel.aggregate as jest.Mock).mockResolvedValue([{}]);

      const result: IUserAnalytics = await analyticsService.getUserAnalytics(userId);

      expect(result).toEqual({
        userId,
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteService: 'none',
        lastOrderDate: expect.any(String),
        timestamp: expect.any(String)
      });
    });

    it('should handle invalid userId', async (): Promise<void> => {
      await expect(analyticsService.getUserAnalytics('invalid-id'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle database errors', async (): Promise<void> => {
      const error = new Error('Database error');
      (OrderModel.aggregate as jest.Mock).mockRejectedValue(error);

      await expect(analyticsService.getUserAnalytics(userId))
        .rejects.toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch user analytics', 
        expect.objectContaining({ error, userId })
      );
    });
  });
}); 