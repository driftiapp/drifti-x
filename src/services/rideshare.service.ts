import { performance } from 'perf_hooks';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';
import { DatabaseError, ValidationError, NotFoundError } from '../utils/errorHandler';
import { Ride } from '../models/ride.model';
import { 
  IRide, 
  IRideResponse, 
  RideStatus,
  RideType
} from '../types/ride';

export class RideshareService {
  private static instance: RideshareService;

  private constructor() {}

  public static getInstance(): RideshareService {
    if (!RideshareService.instance) {
      RideshareService.instance = new RideshareService();
    }
    return RideshareService.instance;
  }

  async createRide(rideData: Partial<IRide>): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Creating ride', { rideData });

    try {
      const ride = await Ride.create(rideData);
      logger.info(`Ride created successfully in ${performance.now() - startTime}ms`, { rideId: ride._id });
      return ride;
    } catch (error) {
      logger.error('Failed to create ride', { error, rideData });
      throw new DatabaseError('Failed to create ride', {
        context: { error },
        fingerprint: ['rideshare', 'ride', 'create-failed']
      });
    }
  }

  async getRideById(rideId: Types.ObjectId): Promise<IRide | null> {
    const startTime = performance.now();
    logger.info('Fetching ride', { rideId });

    try {
      const ride = await Ride.findById(rideId)
        .populate('passenger', 'name email')
        .populate('driver', 'name email');
      
      logger.info(`Ride fetched successfully in ${performance.now() - startTime}ms`, { rideId });
      return ride;
    } catch (error) {
      logger.error('Failed to fetch ride', { error, rideId });
      throw new DatabaseError('Failed to fetch ride', {
        context: { error },
        fingerprint: ['rideshare', 'ride', 'fetch-failed']
      });
    }
  }

  async getRidesByPassenger(passengerId: Types.ObjectId): Promise<IRide[]> {
    const startTime = performance.now();
    logger.info('Fetching passenger rides', { passengerId });

    try {
      const rides = await Ride.find({ passenger: passengerId })
        .sort({ createdAt: -1 })
        .populate('driver', 'name email');
      
      logger.info(`Passenger rides fetched successfully in ${performance.now() - startTime}ms`, { 
        passengerId,
        count: rides.length 
      });
      return rides;
    } catch (error) {
      logger.error('Failed to fetch passenger rides', { error, passengerId });
      throw new DatabaseError('Failed to fetch passenger rides', {
        context: { error },
        fingerprint: ['rideshare', 'rides', 'fetch-failed']
      });
    }
  }

  async getRidesByStatus(status: RideStatus): Promise<IRide[]> {
    const startTime = performance.now();
    logger.info('Fetching rides by status', { status });

    try {
      const rides = await Ride.find({ status })
        .sort({ createdAt: 1 })
        .populate('passenger', 'name email');
      
      logger.info(`Rides fetched successfully in ${performance.now() - startTime}ms`, { 
        status,
        count: rides.length 
      });
      return rides;
    } catch (error) {
      logger.error('Failed to fetch rides by status', { error, status });
      throw new DatabaseError('Failed to fetch rides by status', {
        context: { error },
        fingerprint: ['rideshare', 'rides', 'fetch-failed']
      });
    }
  }

  async updateRideStatus(rideId: Types.ObjectId, status: RideStatus, userId?: Types.ObjectId): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Updating ride status', { rideId, status, userId });

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        throw new NotFoundError('Ride not found', {
          fingerprint: ['rideshare', 'ride', 'not-found']
        });
      }

      // Validate status transition
      if (userId && ride.driver && !ride.driver.equals(userId)) {
        throw new ValidationError('Unauthorized to update ride status', {
          context: { rideId, userId },
          fingerprint: ['rideshare', 'ride', 'unauthorized']
        });
      }

      ride.status = status;
      if (status === RideStatus.IN_PROGRESS) {
        ride.startedAt = new Date();
      } else if (status === RideStatus.COMPLETED) {
        ride.completedAt = new Date();
      }
      await ride.save();

      logger.info(`Ride status updated successfully in ${performance.now() - startTime}ms`, { 
        rideId,
        status 
      });
      return ride;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update ride status', { error, rideId, status });
      throw new DatabaseError('Failed to update ride status', {
        context: { error },
        fingerprint: ['rideshare', 'ride', 'update-failed']
      });
    }
  }

  async updateRideRating(rideId: Types.ObjectId, rating: number, comment?: string): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Updating ride rating', { rideId, rating });

    try {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        throw new NotFoundError('Ride not found', {
          fingerprint: ['rideshare', 'ride', 'not-found']
        });
      }

      if (ride.status !== RideStatus.COMPLETED) {
        throw new ValidationError('Can only rate completed rides', {
          context: { rideId, status: ride.status },
          fingerprint: ['rideshare', 'ride', 'invalid-status']
        });
      }

      ride.rating = rating;
      ride.comment = comment;
      await ride.save();

      logger.info(`Ride rating updated successfully in ${performance.now() - startTime}ms`, { 
        rideId,
        rating 
      });
      return ride;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update ride rating', { error, rideId, rating });
      throw new DatabaseError('Failed to update ride rating', {
        context: { error },
        fingerprint: ['rideshare', 'ride', 'update-failed']
      });
    }
  }

  async getDriverEarnings(driverId: Types.ObjectId): Promise<{ totalEarnings: number; completedRides: number }> {
    const startTime = performance.now();
    logger.info('Fetching driver earnings', { driverId });

    try {
      const rides = await Ride.find({
        driver: driverId,
        status: RideStatus.COMPLETED
      });

      const totalEarnings = rides.reduce((total, ride) => total + (ride.fare || 0), 0);

      logger.info(`Driver earnings fetched successfully in ${performance.now() - startTime}ms`, { 
        driverId,
        totalEarnings,
        completedRides: rides.length
      });

      return {
        totalEarnings,
        completedRides: rides.length
      };
    } catch (error) {
      logger.error('Failed to fetch driver earnings', { error, driverId });
      throw new DatabaseError('Failed to fetch driver earnings', {
        context: { error },
        fingerprint: ['rideshare', 'earnings', 'fetch-failed']
      });
    }
  }
} 