import { Router } from 'express';
import { FoodDeliveryController } from '../controllers/foodDelivery.controller';
import { validateRequest } from '../middleware/validateRequest';
import { orderSchema } from '../types/foodDelivery';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/user';
import { logger } from '../utils/logger';

const router = Router();
const controller = FoodDeliveryController.getInstance();

// Create new food order
router.post(
  '/orders',
  authenticate,
  authorize([UserRole.CUSTOMER]),
  validateRequest({ body: orderSchema }),
  async (req, res, next) => {
    try {
      await controller.createOrder(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get order by ID
router.get(
  '/orders/:id',
  authenticate,
  authorize([UserRole.CUSTOMER, UserRole.RESTAURANT, UserRole.DRIVER]),
  async (req, res, next) => {
    try {
      await controller.getOrderById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Update order status
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize([UserRole.RESTAURANT, UserRole.DRIVER]),
  async (req, res, next) => {
    try {
      await controller.updateOrderStatus(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Get restaurant menu
router.get(
  '/restaurants/:id/menu',
  authenticate,
  authorize([UserRole.CUSTOMER, UserRole.RESTAURANT]),
  async (req, res, next) => {
    try {
      await controller.getRestaurantMenu(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Assign delivery driver
router.post(
  '/orders/:id/delivery',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.RESTAURANT]),
  async (req, res, next) => {
    try {
      await controller.assignDriver(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export const foodDeliveryRoutes = router; 