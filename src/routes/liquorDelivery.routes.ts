import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { LiquorDeliveryController } from '../controllers/liquorDelivery.controller';
import { UserRole } from '../types/user';
import { orderSchema } from '../types/liquorDelivery';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const controller = LiquorDeliveryController.getInstance();

// Apply authentication to all liquor delivery routes
router.use(authenticate);

// Customer routes
router.post(
  '/orders',
  validateRequest({ body: orderSchema }),
  controller.createOrder.bind(controller)
);

router.get(
  '/orders',
  controller.getMyOrders.bind(controller)
);

router.get(
  '/orders/:id',
  controller.getOrderDetails.bind(controller)
);

router.patch(
  '/orders/:id/cancel',
  controller.cancelOrder.bind(controller)
);

// Store routes
router.use(roleMiddleware([UserRole.STORE]));
router.get(
  '/store/orders',
  controller.getStoreOrders.bind(controller)
);

router.patch(
  '/orders/:id/accept',
  controller.acceptOrder.bind(controller)
);

router.patch(
  '/orders/:id/prepare',
  controller.prepareOrder.bind(controller)
);

router.patch(
  '/orders/:id/ready',
  controller.markOrderReady.bind(controller)
);

// Driver routes
router.use(roleMiddleware([UserRole.DRIVER]));
router.get(
  '/available-orders',
  controller.getAvailableOrders.bind(controller)
);

router.patch(
  '/orders/:id/pickup',
  controller.pickupOrder.bind(controller)
);

router.patch(
  '/orders/:id/deliver',
  controller.deliverOrder.bind(controller)
);

router.get(
  '/driver/earnings',
  controller.getDriverEarnings.bind(controller)
);

export const liquorDeliveryRoutes = router; 