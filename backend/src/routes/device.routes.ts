import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { IController } from '../types/controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller: IController = DeviceController.getInstance();

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Get user's trusted devices
 *     description: Retrieve a list of all trusted devices for the authenticated user
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trusted devices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeviceResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, controller.getUserDevices);

/**
 * @swagger
 * /devices/{deviceId}:
 *   delete:
 *     summary: Revoke device access
 *     description: Remove a device from the user's trusted devices list
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the device to revoke
 *     responses:
 *       200:
 *         description: Device access revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Device access revoked successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:deviceId', authenticate, controller.revokeDevice);

export default router; 