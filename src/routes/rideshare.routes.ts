import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { RideshareController } from '../controllers/rideshare.controller';
import { UserRole } from '../types/user';
import { rideSchema, rideStatusSchema } from '../types/ride';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();
const rideshareController = RideshareController.getInstance();

// Apply authentication to all rideshare routes
router.use(authenticate);

// Passenger routes
router.post(
  '/',
  validateRequest({ body: rideSchema }),
  rideshareController.bookRide.bind(rideshareController)
);

router.get(
  '/my-rides',
  rideshareController.getMyRides.bind(rideshareController)
);

router.get(
  '/:id',
  rideshareController.getRideDetails.bind(rideshareController)
);

router.patch(
  '/:id/cancel',
  rideshareController.cancelRide.bind(rideshareController)
);

router.patch(
  '/:id/rate',
  validateRequest({ body: rideStatusSchema }),
  rideshareController.rateRide.bind(rideshareController)
);

// Driver routes
router.get(
  '/available',
  roleMiddleware([UserRole.DRIVER]),
  rideshareController.getAvailableRides.bind(rideshareController)
);

router.patch(
  '/:id/accept',
  roleMiddleware([UserRole.DRIVER]),
  rideshareController.acceptRide.bind(rideshareController)
);

router.patch(
  '/:id/start',
  roleMiddleware([UserRole.DRIVER]),
  rideshareController.startRide.bind(rideshareController)
);

router.patch(
  '/:id/complete',
  roleMiddleware([UserRole.DRIVER]),
  rideshareController.completeRide.bind(rideshareController)
);

router.get(
  '/driver/earnings',
  roleMiddleware([UserRole.DRIVER]),
  rideshareController.getDriverEarnings.bind(rideshareController)
);

export default router; 