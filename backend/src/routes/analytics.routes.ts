import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { 
  getAnalytics, 
  getSystemStats, 
  createAnalytics, 
  updateAnalytics, 
  deleteAnalytics,
  trackPageView,
  trackClick,
  trackSystemMetric
} from '../controllers/analytics.controller';

const router = Router();

// Public tracking endpoints
router.post('/track/page-view', trackPageView);
router.post('/track/click', trackClick);

// Protected analytics endpoints
router.get('/', auth, getAnalytics);
router.get('/stats', auth, getSystemStats);
router.post('/', auth, createAnalytics);
router.put('/:id', auth, updateAnalytics);
router.delete('/:id', auth, deleteAnalytics);

// System metrics (admin only)
router.post('/system-metric', auth, trackSystemMetric);

export default router; 