import { z } from 'zod';

export interface IAnalyticsMetrics {
  totalOrders: number;
  activeUsers: number;
  revenue: number;
  averageOrderValue: number;
  timestamp: string;
}

export interface IAnalyticsTrends {
  orderTrends: Array<{ date: string; count: number }>;
  revenueTrends: Array<{ date: string; amount: number }>;
  userTrends: Array<{ date: string; count: number }>;
  timestamp: string;
}

export interface IUserAnalytics {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteService: string;
  lastOrderDate: string;
  timestamp: string;
}

export interface IAnalyticsResponse {
  success: boolean;
  data: IAnalyticsMetrics | IAnalyticsTrends | IUserAnalytics;
  timestamp: string;
}

// Validation schemas
export const analyticsMetricsSchema = z.object({
  totalOrders: z.number().min(0),
  activeUsers: z.number().min(0),
  revenue: z.number().min(0),
  averageOrderValue: z.number().min(0),
  timestamp: z.string().datetime()
});

export const analyticsTrendsSchema = z.object({
  orderTrends: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      count: z.number().min(0)
    })
  ),
  revenueTrends: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      amount: z.number().min(0)
    })
  ),
  userTrends: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      count: z.number().min(0)
    })
  ),
  timestamp: z.string().datetime()
});

export const userAnalyticsSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),  // MongoDB ObjectId format
  totalOrders: z.number().min(0),
  totalSpent: z.number().min(0),
  averageOrderValue: z.number().min(0),
  favoriteService: z.string(),
  lastOrderDate: z.string().datetime(),
  timestamp: z.string().datetime()
}); 