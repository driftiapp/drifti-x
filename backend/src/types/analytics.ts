import { z } from 'zod';

/**
 * Interface for analytics metrics
 * @interface IAnalyticsMetrics
 */
export interface IAnalyticsMetrics {
  totalOrders: number;
  activeUsers: number;
  revenue: number;
  averageOrderValue: number;
  timestamp: string;
}

/**
 * Interface for analytics trends
 * @interface IAnalyticsTrends
 */
export interface IAnalyticsTrends {
  orderTrends: Array<{
    date: string;
    count: number;
  }>;
  revenueTrends: Array<{
    date: string;
    amount: number;
  }>;
  userTrends: Array<{
    date: string;
    count: number;
  }>;
  timestamp: string;
}

/**
 * Interface for user analytics
 * @interface IUserAnalytics
 */
export interface IUserAnalytics {
  totalOrders: number;
  totalSpent: number;
  favoriteService: string | null;
  timestamp: string;
}

/**
 * Zod schema for validating analytics metrics
 */
export const analyticsMetricsSchema = z.object({
  totalOrders: z.number().min(0),
  activeUsers: z.number().min(0),
  revenue: z.number().min(0),
  averageOrderValue: z.number().min(0),
  timestamp: z.string().datetime()
});

/**
 * Zod schema for validating analytics trends
 */
export const analyticsTrendsSchema = z.object({
  orderTrends: z.array(
    z.object({
      date: z.string(),
      count: z.number().min(0)
    })
  ),
  revenueTrends: z.array(
    z.object({
      date: z.string(),
      amount: z.number().min(0)
    })
  ),
  userTrends: z.array(
    z.object({
      date: z.string(),
      count: z.number().min(0)
    })
  ),
  timestamp: z.string().datetime()
});

/**
 * Zod schema for validating user analytics
 */
export const userAnalyticsSchema = z.object({
  totalOrders: z.number().min(0),
  totalSpent: z.number().min(0),
  favoriteService: z.string().nullable(),
  timestamp: z.string().datetime()
}); 