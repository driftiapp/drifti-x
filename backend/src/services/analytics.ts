import { logger } from '../utils/logger';

export type AnalyticsEvent = {
  event: 'qr_scan' | 'sms_tap';
  source: 'homepage' | 'marketing' | 'app';
  metadata?: Record<string, any>;
};

export class AnalyticsService {
  static async trackEvent(event: AnalyticsEvent) {
    try {
      // Log the event
      logger.info('Analytics Event', {
        ...event,
        timestamp: new Date().toISOString(),
      });

      // Here you can add additional analytics providers
      // For example: Google Analytics, Mixpanel, etc.
      
      return true;
    } catch (error) {
      logger.error('Failed to track analytics event', {
        error,
        event,
      });
      return false;
    }
  }
} 