import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user';

const router = Router();

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     summary: Get analytics metrics
 *     description: Retrieve overall platform metrics including total orders, active users, and revenue
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/metrics',
  authorize([UserRole.ADMIN]),
  analyticsController.getMetrics.bind(analyticsController)
);

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get analytics trends
 *     description: Retrieve trends data for orders, revenue, and users over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timePeriod
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for trends data
 *     responses:
 *       200:
 *         description: Analytics trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  '/trends',
  authorize([UserRole.ADMIN]),
  analyticsController.getTrends.bind(analyticsController)
);

/**
 * @swagger
 * /api/analytics/users/{userId}:
 *   get:
 *     summary: Get user analytics
 *     description: Retrieve analytics data for a specific user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or self access required
 *       404:
 *         description: User not found
 */
router.get(
  '/users/:userId',
  authorize([UserRole.ADMIN, UserRole.CUSTOMER]),
  analyticsController.getUserAnalytics.bind(analyticsController)
);

export default router; 