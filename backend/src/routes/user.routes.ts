import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import {
  attachUserResponse,
  requireAuth,
  requireAdmin,
  logUserActivity,
  handlePagination,
  handleSorting,
  handleFiltering
} from '../middleware/user.middleware';
import { UserModel } from '../models/user.model';

const router = Router();

// Apply global middleware
router.use(logUserActivity);
router.use(attachUserResponse);

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/password/reset-request', UserController.requestPasswordReset);
router.post('/password/reset', UserController.resetPassword);
router.post('/verify/email', UserController.verifyEmail);
router.post('/verify/phone', UserController.verifyPhone);

// Protected routes
router.use(requireAuth);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

// Admin routes
router.use('/admin', requireAdmin);

router.put('/admin/users/:userId/role', UserController.updateRole);

// User management routes with pagination and filtering
router.get('/users', [
  handlePagination,
  handleSorting,
  handleFiltering,
  async (req, res, next) => {
    try {
      const { page, limit, skip } = req.pagination;
      const { sorting } = req;
      const { filter } = req;

      const [users, total] = await Promise.all([
        UserModel.find(filter)
          .sort(sorting)
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(filter)
      ]);

      res.status(200).json({
        users: users.map(user => res.locals.formatUserResponse(user)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
]);

export default router; 