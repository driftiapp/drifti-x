import { Router } from 'express';
import { AnalyticsService } from '../services/analytics';
import { analyticsRateLimiter } from '../middleware/rateLimiter';
import UAParser from 'ua-parser-js';

const router = Router();

router.post('/', analyticsRateLimiter, async (req, res) => {
  try {
    const { event, source, metadata = {} } = req.body;
    
    // Parse user agent for device and browser info
    const parser = new UAParser(req.headers['user-agent']);
    const deviceInfo = parser.getDevice();
    const browserInfo = parser.getBrowser();
    
    // Get time of day
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    // Get referral source from query params
    const utmSource = req.query.utm_source as string;
    
    // Enrich metadata with additional context
    const enrichedMetadata = {
      ...metadata,
      device: deviceInfo.type || 'desktop',
      browser: browserInfo.name || 'unknown',
      timeOfDay,
      utmSource,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    await AnalyticsService.trackEvent({
      event,
      source,
      metadata: enrichedMetadata,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 