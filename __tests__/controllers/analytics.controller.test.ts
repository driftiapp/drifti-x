import { Request, Response } from 'express';
import { analyticsController } from '../../src/controllers/analytics.controller';
import { analyticsService } from '../../src/services/analytics.service';
import { AppError } from '../../src/utils/errorHandler';
import { logger } from '../../src/utils/logger';
import { IAnalyticsMetrics, IAnalyticsTrends, IUserAnalytics } from '../../src/types/analytics';
import { DatabaseError } from '../../src/utils/errorHandler';

// Mock dependencies
jest.mock('../../src/services/analytics.service');
jest.mock('../../src/utils/logger');
jest.mock('@sentry/node');

describe('AnalyticsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach((): void => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockNext = jest.fn();
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getMetrics', () => {
    const mockMetrics: IAnalyticsMetrics = {
      totalOrders: 100,
      activeUsers: 50,
      revenue: 5000,
      averageOrderValue: 50,
      timestamp: '2024-03-15T00:00:00.000Z'
    };

    it('should return metrics successfully', async (): Promise<void> => {
      (analyticsService.getMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      await analyticsController.getMetrics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockMetrics,
        message: 'Analytics metrics retrieved successfully',
        timestamp: expect.any(String)
      });
      expect(logger.info).toHaveBeenCalledWith('Fetching analytics metrics');
    });

    it('should handle service errors', async (): Promise<void> => {
      const error = new DatabaseError('Database error');
      (analyticsService.getMetrics as jest.Mock).mockRejectedValue(error);

      await analyticsController.getMetrics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith('Analytics operation failed', 
        expect.objectContaining({
          error: error.message,
          context: error.context,
          fingerprint: error.fingerprint
        })
      );
    });

    it('should handle unexpected errors', async (): Promise<void> => {
      const error = new Error('Unexpected error');
      (analyticsService.getMetrics as jest.Mock).mockRejectedValue(error);

      await analyticsController.getMetrics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to process analytics request',
          statusCode: 500
        })
      );
      expect(logger.error).toHaveBeenCalledWith('Unexpected analytics error', 
        expect.objectContaining({ error })
      );
    });
  });

  describe('getTrends', () => {
    const mockTrends: IAnalyticsTrends = {
      orderTrends: [{ date: '2024-03-15', count: 10 }],
      revenueTrends: [{ date: '2024-03-15', amount: 500 }],
      userTrends: [{ date: '2024-03-15', count: 5 }],
      timestamp: '2024-03-15T00:00:00.000Z'
    };

    it('should return trends with default time period', async (): Promise<void> => {
      mockRequest.query = {};
      (analyticsService.getTrends as jest.Mock).mockResolvedValue(mockTrends);

      await analyticsController.getTrends[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTrends).toHaveBeenCalledWith('30d');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTrends,
        message: 'Analytics trends for period 30d retrieved successfully',
        timestamp: expect.any(String)
      });
    });

    it('should return trends with custom time period', async (): Promise<void> => {
      mockRequest.query = { timePeriod: '7d' };
      (analyticsService.getTrends as jest.Mock).mockResolvedValue(mockTrends);

      await analyticsController.getTrends[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getTrends).toHaveBeenCalledWith('7d');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTrends,
        message: 'Analytics trends for period 7d retrieved successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle validation errors', async (): Promise<void> => {
      mockRequest.query = { timePeriod: 'invalid' };

      await analyticsController.getTrends[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid analytics request parameters',
          statusCode: 400
        })
      );
      expect(logger.error).toHaveBeenCalledWith('Analytics validation failed', 
        expect.any(Object)
      );
    });

    it('should handle service errors', async (): Promise<void> => {
      mockRequest.query = { timePeriod: '7d' };
      const error = new DatabaseError('Database error');
      (analyticsService.getTrends as jest.Mock).mockRejectedValue(error);

      await analyticsController.getTrends[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith('Analytics operation failed', 
        expect.objectContaining({
          error: error.message,
          context: error.context,
          fingerprint: error.fingerprint
        })
      );
    });
  });

  describe('getUserAnalytics', () => {
    const mockUserAnalytics: IUserAnalytics = {
      userId: 'user123',
      totalOrders: 50,
      totalSpent: 2500,
      averageOrderValue: 50,
      favoriteService: 'rideshare',
      lastOrderDate: '2024-03-15T00:00:00.000Z',
      timestamp: '2024-03-15T00:00:00.000Z'
    };

    it('should return user analytics successfully', async (): Promise<void> => {
      mockRequest.params = { userId: 'user123' };
      (analyticsService.getUserAnalytics as jest.Mock).mockResolvedValue(mockUserAnalytics);

      await analyticsController.getUserAnalytics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(analyticsService.getUserAnalytics).toHaveBeenCalledWith('user123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUserAnalytics,
        message: 'Analytics for user user123 retrieved successfully',
        timestamp: expect.any(String)
      });
    });

    it('should handle validation errors', async (): Promise<void> => {
      mockRequest.params = { userId: 'invalid-id' };

      await analyticsController.getUserAnalytics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid analytics request parameters',
          statusCode: 400
        })
      );
      expect(logger.error).toHaveBeenCalledWith('Analytics validation failed', 
        expect.any(Object)
      );
    });

    it('should handle service errors', async (): Promise<void> => {
      mockRequest.params = { userId: 'user123' };
      const error = new DatabaseError('Database error');
      (analyticsService.getUserAnalytics as jest.Mock).mockRejectedValue(error);

      await analyticsController.getUserAnalytics[1](
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith('Analytics operation failed', 
        expect.objectContaining({
          error: error.message,
          context: error.context,
          fingerprint: error.fingerprint
        })
      );
    });
  });
}); 