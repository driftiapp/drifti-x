import { Router } from 'express';
import { smokeShopController } from '../controllers/smokeShop.controller.new';
import { IController } from '../types/controller';

const router = Router();
const controller: IController = smokeShopController;

// Product routes
router.get('/products', controller.getProducts);
router.get('/products/:id', controller.getProductById);
router.post('/products', controller.createProduct);
router.put('/products/:id', controller.updateProduct);
router.delete('/products/:id', controller.deleteProduct);

// Order routes
router.get('/orders', controller.getOrders);
router.get('/orders/:id', controller.getOrderById);
router.post('/orders', controller.createOrder);
router.put('/orders/:id', controller.updateOrder);
router.delete('/orders/:id', controller.deleteOrder);

// Category routes
router.get('/categories', controller.getCategories);
router.post('/categories', controller.createCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

export default router; 