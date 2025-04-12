import { Router } from 'express';
import { SmokeShopController } from '../controllers/smokeShop.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validateRequest';
import { UserRole } from '../types/user';
import { z } from 'zod';

const router = Router();
const controller = SmokeShopController.getInstance();

// Apply auth middleware to all smoke shop routes
router.use(authenticate);

// Validation schemas
const placeOrderSchema = {
  body: z.object({
    shopId: z.string().min(1, 'Shop ID is required'),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1')
    })),
    deliveryAddress: z.string().min(1, 'Delivery address is required')
  })
};

const rateOrderSchema = {
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  })
};

// Customer routes
router.post(
  '/order',
  validateRequest(placeOrderSchema),
  controller.placeOrder.bind(controller)
);

router.get('/orders', controller.getMyOrders.bind(controller));
router.get('/orders/:id', controller.getOrderDetails.bind(controller));
router.post('/orders/:id/cancel', controller.cancelOrder.bind(controller));
router.post('/orders/:id/rate', validateRequest(rateOrderSchema), controller.rateOrder.bind(controller));

// Shop routes
router.get('/shop/orders', authorize([UserRole.RESTAURANT]), controller.getShopOrders.bind(controller));
router.post('/shop/orders/:id/accept', authorize([UserRole.RESTAURANT]), controller.acceptOrder.bind(controller));
router.post('/shop/orders/:id/prepare', authorize([UserRole.RESTAURANT]), controller.prepareOrder.bind(controller));
router.post('/shop/orders/:id/ready', authorize([UserRole.RESTAURANT]), controller.markOrderReady.bind(controller));

// Driver routes
router.get('/driver/orders', authorize([UserRole.DRIVER]), controller.getAvailableOrders.bind(controller));
router.post('/driver/orders/:id/pickup', authorize([UserRole.DRIVER]), controller.pickupOrder.bind(controller));
router.post('/driver/orders/:id/deliver', authorize([UserRole.DRIVER]), controller.deliverOrder.bind(controller));
router.get('/driver/earnings', authorize([UserRole.DRIVER]), controller.getDriverEarnings.bind(controller));

// Shop management routes
router.post('/shops', authorize([UserRole.ADMIN]), SmokeShopController.createShop);
router.get('/shops/:id', SmokeShopController.getShop);
router.put('/shops/:id', authorize([UserRole.ADMIN]), SmokeShopController.updateShop);
router.delete('/shops/:id', authorize([UserRole.ADMIN]), SmokeShopController.deleteShop);
router.get('/shops/nearby', SmokeShopController.getShopsNearby);

// Product management routes
router.post('/shops/:id/products', authorize([UserRole.ADMIN]), SmokeShopController.addProduct);
router.put('/shops/:id/products/:productId', authorize([UserRole.ADMIN]), SmokeShopController.updateProduct);
router.delete('/shops/:id/products/:productId', authorize([UserRole.ADMIN]), SmokeShopController.deleteProduct);

// Shop settings routes
router.put('/shops/:id/opening-hours', authorize([UserRole.ADMIN]), SmokeShopController.updateOpeningHours);
router.put('/shops/:id/rating', authorize([UserRole.ADMIN]), SmokeShopController.updateRating);

export default router; 