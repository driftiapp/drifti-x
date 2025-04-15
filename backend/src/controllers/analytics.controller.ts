import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AnalyticsService } from '../services/analytics.service';
import { requireAdmin } from '../middlewares/auth';

// Get analytics data
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateRange, groupBy, filter, userId } = req.query;
    const data = await AnalyticsService.getAnalyticsData({
      dateRange: dateRange as string,
      groupBy: groupBy as string,
      filter: filter as string,
      userId: userId as string
    });
    res.status(200).json(data);
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get system stats
export const getSystemStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateRange } = req.query;
    const stats = await AnalyticsService.getSystemStats(dateRange as string);
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new analytics entry
export const createAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await AnalyticsService.trackEvent(req.body);
    res.status(201).json(analytics);
  } catch (error) {
    logger.error('Error creating analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Track page view
export const trackPageView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page } = req.body;
    const userId = req.user?.id;
    const analytics = await AnalyticsService.trackPageView(userId, page);
    res.status(201).json(analytics);
  } catch (error) {
    logger.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Track click event
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { button, page } = req.body;
    const userId = req.user?.id;
    const analytics = await AnalyticsService.trackClick(userId, button, page);
    res.status(201).json(analytics);
  } catch (error) {
    logger.error('Error tracking click:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Track system metric
export const trackSystemMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { metric, value, tags } = req.body;
    const analytics = await AnalyticsService.trackSystemMetric(metric, value, tags);
    res.status(201).json(analytics);
  } catch (error) {
    logger.error('Error tracking system metric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update analytics data
export const updateAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement actual analytics data update
    res.status(200).json({ message: `Analytics data ${id} updated successfully` });
  } catch (error) {
    logger.error('Error updating analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete analytics data
export const deleteAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement actual analytics data deletion
    res.status(200).json({ message: `Analytics data ${id} deleted successfully` });
  } catch (error) {
    logger.error('Error deleting analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 