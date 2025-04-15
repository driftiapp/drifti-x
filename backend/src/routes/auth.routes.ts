import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { IController } from '../types/controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller: IController = AuthController.getInstance();

// Auth routes
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/refresh-token', controller.refreshToken);
router.get('/validate-token', controller.validateToken);

// Device trust routes
router.get('/validate-device-trust', controller.validateDeviceTrust);

// Email verification
router.get('/verify-email', controller.verifyEmail);

// Password reset
router.post('/request-reset', controller.requestPasswordReset);
router.post('/reset-password', controller.resetPassword);

export default router; 