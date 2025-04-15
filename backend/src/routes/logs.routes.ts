import { Router } from 'express';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorize.middleware';
import { AppError } from '../utils/AppError';

const router = Router();

// Get logs (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { level, limit } = req.query;
    const logs = await logger.getLogs(
      level as string | undefined,
      limit ? parseInt(limit as string) : 100
    );
    res.json({ logs });
  } catch (error) {
    throw new AppError('Failed to fetch logs', 500);
  }
});

// Get error logs (admin only)
router.get('/errors', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { limit } = req.query;
    const logs = await logger.getLogs('error', limit ? parseInt(limit as string) : 100);
    res.json({ logs });
  } catch (error) {
    throw new AppError('Failed to fetch error logs', 500);
  }
});

export default router; 