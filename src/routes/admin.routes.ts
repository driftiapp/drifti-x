import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// System management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Log management
router.get('/logs', adminController.getLogs);
router.post('/log-level', adminController.setLogLevel);

// System status
router.get('/status', adminController.getSystemStatus);

export const adminRoutes = router; 