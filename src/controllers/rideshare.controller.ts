import { Request, Response } from 'express';
import { performance } from 'perf_hooks';
import { Types } from 'mongoose';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { DatabaseError, ValidationError, NotFoundError } from '../utils/errorHandler';
import { Ride } from '../models/ride.model';
import { 
  IRide, 
  IRideResponse,
  IRidesResponse,
  rideSchema, 
  rideResponseSchema,
  RideStatus,
  RideType
} from '../types/ride';
import { RideshareService } from '../services/rideshare.service';

export class RideshareController {
  private static instance: RideshareController;
  private rideshareService: RideshareService;

  private constructor() {
    this.rideshareService = RideshareService.getInstance();
  }

  public static getInstance(): RideshareController {
    if (!RideshareController.instance) {
      RideshareController.instance = new RideshareController();
    }
    return RideshareController.instance;
  }

  async bookRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const validatedData = rideSchema.parse(req.body);
      const userId = new Types.ObjectId(req.user?.userId);

      const ride = await this.rideshareService.createRide({
        ...validatedData,
        passenger: userId,
        status: RideStatus.PENDING
      });

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride booked successfully', {
        rideId: ride._id,
        duration: performance.now() - startTime
      });

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid ride data', {
          context: { error: error.errors },
          fingerprint: ['rideshare', 'booking', 'validation-failed']
        });
      }
      logger.error('Error booking ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to book ride', {
        context: { error },
        fingerprint: ['rideshare', 'booking', 'create-failed']
      });
    }
  }

  async getMyRides(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const userId = new Types.ObjectId(req.user?.userId);
      const rides = await this.rideshareService.getRidesByPassenger(userId);

      const response: IRidesResponse = {
        success: true,
        data: rides,
        timestamp: new Date().toISOString()
      };

      logger.info('User rides fetched successfully', {
        userId,
        count: rides.length,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error fetching user rides', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to fetch user rides', {
        context: { error },
        fingerprint: ['rideshare', 'rides', 'fetch-failed']
      });
    }
  }

  async getRideDetails(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const ride = await this.rideshareService.getRideById(rideId);

      if (!ride) {
        throw new NotFoundError('Ride not found', {
          fingerprint: ['rideshare', 'ride', 'not-found']
        });
      }

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride details fetched successfully', {
        rideId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching ride details', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to fetch ride details', {
        context: { error },
        fingerprint: ['rideshare', 'details', 'fetch-failed']
      });
    }
  }

  async cancelRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const userId = new Types.ObjectId(req.user?.userId);

      const ride = await this.rideshareService.updateRideStatus(rideId, RideStatus.CANCELLED, userId);

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride cancelled successfully', {
        rideId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error cancelling ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to cancel ride', {
        context: { error },
        fingerprint: ['rideshare', 'cancel', 'failed']
      });
    }
  }

  async rateRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const { rating, comment } = req.body;

      const ride = await this.rideshareService.updateRideRating(rideId, rating, comment);

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride rated successfully', {
        rideId,
        rating,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error rating ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to rate ride', {
        context: { error },
        fingerprint: ['rideshare', 'rating', 'failed']
      });
    }
  }

  async getAvailableRides(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rides = await this.rideshareService.getRidesByStatus(RideStatus.PENDING);

      const response: IRidesResponse = {
        success: true,
        data: rides,
        timestamp: new Date().toISOString()
      };

      logger.info('Available rides fetched successfully', {
        count: rides.length,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error fetching available rides', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to fetch available rides', {
        context: { error },
        fingerprint: ['rideshare', 'available', 'fetch-failed']
      });
    }
  }

  async acceptRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const driverId = new Types.ObjectId(req.user?.userId);

      const ride = await this.rideshareService.updateRideStatus(rideId, RideStatus.ACCEPTED, driverId);

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride accepted successfully', {
        rideId,
        driverId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error accepting ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to accept ride', {
        context: { error },
        fingerprint: ['rideshare', 'accept', 'failed']
      });
    }
  }

  async startRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const driverId = new Types.ObjectId(req.user?.userId);

      const ride = await this.rideshareService.updateRideStatus(rideId, RideStatus.IN_PROGRESS, driverId);

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride started successfully', {
        rideId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error starting ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to start ride', {
        context: { error },
        fingerprint: ['rideshare', 'start', 'failed']
      });
    }
  }

  async completeRide(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const rideId = new Types.ObjectId(req.params.id);
      const driverId = new Types.ObjectId(req.user?.userId);

      const ride = await this.rideshareService.updateRideStatus(rideId, RideStatus.COMPLETED, driverId);

      const response: IRideResponse = {
        success: true,
        data: ride,
        timestamp: new Date().toISOString()
      };

      logger.info('Ride completed successfully', {
        rideId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error completing ride', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to complete ride', {
        context: { error },
        fingerprint: ['rideshare', 'complete', 'failed']
      });
    }
  }

  async getDriverEarnings(req: Request, res: Response): Promise<void> {
    const startTime = performance.now();
    try {
      const driverId = new Types.ObjectId(req.user?.userId);
      const earnings = await this.rideshareService.getDriverEarnings(driverId);

      const response = {
        success: true,
        data: earnings,
        timestamp: new Date().toISOString()
      };

      logger.info('Driver earnings fetched successfully', {
        driverId,
        duration: performance.now() - startTime
      });

      res.json(response);
    } catch (error) {
      logger.error('Error fetching driver earnings', {
        error,
        duration: performance.now() - startTime
      });
      throw new DatabaseError('Failed to fetch driver earnings', {
        context: { error },
        fingerprint: ['rideshare', 'earnings', 'fetch-failed']
      });
    }
  }
} 