import { Router, Request, Response, NextFunction } from 'express';
import { LiquorDeliveryController } from '../controllers/liquorDelivery.controller';
import { IController } from '../types/controller';

const router = Router();
const controller: IController = LiquorDeliveryController.getInstance();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Order routes
router.post('/orders', controller.createOrder);
router.get('/orders', controller.getMyOrders);
router.get('/orders/:id', controller.getOrderDetails);
router.put('/orders/:id/cancel', controller.cancelOrder);

// Store routes
router.get('/store/orders', controller.getStoreOrders);
router.put('/store/orders/:id/accept', controller.acceptOrder);
router.put('/store/orders/:id/prepare', controller.prepareOrder);
router.put('/store/orders/:id/ready', controller.markOrderReady);

// Driver routes
router.get('/driver/orders/available', controller.getAvailableOrders);
router.put('/driver/orders/:id/pickup', controller.pickupOrder);
router.put('/driver/orders/:id/deliver', controller.deliverOrder);
router.get('/driver/earnings', controller.getDriverEarnings);

// Delivery routes
router.get('/deliveries', controller.getDeliveries);
router.get('/deliveries/:id', controller.getDeliveryById);
router.put('/deliveries/:id/status', controller.updateDeliveryStatus);

// Product routes
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProductById);
router.post('/products', controller.createProduct);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);

export default router; 