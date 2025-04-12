import mongoose from 'mongoose';
import { IRide, Ride } from '../models/ride.model';
import { logger } from '../utils/logger';
import { DatabaseError, ValidationError, NotFoundError } from '../utils/errorHandler';

export class RideshareRepository {
  private static instance: RideshareRepository;

  private constructor() {}

  public static getInstance(): RideshareRepository {
    if (!RideshareRepository.instance) {
      RideshareRepository.instance = new RideshareRepository();
    }
    return RideshareRepository.instance;
  }

  async createRide(rideData: Partial<IRide>): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Creating new ride in database', { rideData });

    try {
      const ride = new Ride(rideData);
      await ride.save();

      const duration = performance.now() - startTime;
      logger.info(`Ride created successfully in ${duration}ms`, { rideId: ride._id });

      return ride;
    } catch (error: unknown) {
      logger.error('Failed to create ride in database', { error, rideData });
      throw new DatabaseError('Failed to create ride', {
        context: { operation: 'createRide', rideData, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'ride', 'create_error']
      });
    }
  }

  async findNearbyDrivers(coordinates: [number, number], maxDistance: number = 5000): Promise<IRide[]> {
    const startTime = performance.now();
    logger.info('Finding nearby drivers', { coordinates, maxDistance });

    try {
      const availableDrivers = await Ride.find({
        status: 'available',
        'currentLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: maxDistance
          }
        }
      }).populate('driver', 'name rating vehicle');

      const duration = performance.now() - startTime;
      logger.info(`Found ${availableDrivers.length} nearby drivers in ${duration}ms`);

      return availableDrivers;
    } catch (error: unknown) {
      logger.error('Failed to find nearby drivers', { error, coordinates });
      throw new DatabaseError('Failed to find nearby drivers', {
        context: { operation: 'findNearbyDrivers', coordinates, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'driver', 'location_error']
      });
    }
  }

  async updateRideStatus(rideId: string, status: string, updateData: Partial<IRide> = {}): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Updating ride status', { rideId, status, updateData });

    try {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        { 
          $set: { 
            status,
            ...updateData,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!ride) {
        throw new NotFoundError('Ride not found', {
          context: { rideId },
          fingerprint: ['rideshare', 'ride', 'not_found']
        });
      }

      const duration = performance.now() - startTime;
      logger.info(`Ride status updated successfully in ${duration}ms`, { rideId, status });

      return ride;
    } catch (error: unknown) {
      logger.error('Failed to update ride status', { error, rideId, status });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update ride status', {
        context: { operation: 'updateRideStatus', rideId, status, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'ride', 'update_error']
      });
    }
  }

  async getRideById(rideId: string): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Fetching ride by ID', { rideId });

    try {
      const ride = await Ride.findById(rideId)
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone vehicle rating');

      if (!ride) {
        throw new NotFoundError('Ride not found', {
          context: { rideId },
          fingerprint: ['rideshare', 'ride', 'not_found']
        });
      }

      const duration = performance.now() - startTime;
      logger.info(`Ride fetched successfully in ${duration}ms`, { rideId });

      return ride;
    } catch (error: unknown) {
      logger.error('Failed to fetch ride', { error, rideId });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch ride', {
        context: { operation: 'getRideById', rideId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'ride', 'fetch_error']
      });
    }
  }

  async getRidesByPassenger(passengerId: string, status?: string): Promise<IRide[]> {
    const startTime = performance.now();
    logger.info('Fetching rides by passenger', { passengerId, status });

    try {
      const query = { passenger: passengerId } as any;
      if (status) {
        query.status = status;
      }

      const rides = await Ride.find(query)
        .sort({ createdAt: -1 })
        .populate('driver', 'name phone vehicle rating');

      const duration = performance.now() - startTime;
      logger.info(`Fetched ${rides.length} rides for passenger in ${duration}ms`, { passengerId });

      return rides;
    } catch (error: unknown) {
      logger.error('Failed to fetch passenger rides', { error, passengerId });
      throw new DatabaseError('Failed to fetch passenger rides', {
        context: { operation: 'getRidesByPassenger', passengerId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'passenger', 'fetch_error']
      });
    }
  }

  async getRidesByDriver(driverId: string, status?: string): Promise<IRide[]> {
    const startTime = performance.now();
    logger.info('Fetching rides by driver', { driverId, status });

    try {
      const query = { driver: driverId } as any;
      if (status) {
        query.status = status;
      }

      const rides = await Ride.find(query)
        .sort({ createdAt: -1 })
        .populate('passenger', 'name phone');

      const duration = performance.now() - startTime;
      logger.info(`Fetched ${rides.length} rides for driver in ${duration}ms`, { driverId });

      return rides;
    } catch (error: unknown) {
      logger.error('Failed to fetch driver rides', { error, driverId });
      throw new DatabaseError('Failed to fetch driver rides', {
        context: { operation: 'getRidesByDriver', driverId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'driver', 'fetch_error']
      });
    }
  }

  async updateRideLocation(rideId: string, coordinates: [number, number]): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Updating ride location', { rideId, coordinates });

    try {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        { 
          $set: { 
            currentLocation: {
              type: 'Point',
              coordinates: coordinates
            },
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!ride) {
        throw new NotFoundError('Ride not found', {
          context: { rideId },
          fingerprint: ['rideshare', 'ride', 'not_found']
        });
      }

      const duration = performance.now() - startTime;
      logger.info(`Ride location updated successfully in ${duration}ms`, { rideId });

      return ride;
    } catch (error: unknown) {
      logger.error('Failed to update ride location', { error, rideId });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update ride location', {
        context: { operation: 'updateRideLocation', rideId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'ride', 'location_error']
      });
    }
  }

  async completeRide(rideId: string, rating?: number, comment?: string): Promise<IRide> {
    const startTime = performance.now();
    logger.info('Completing ride', { rideId, rating, comment });

    try {
      const ride = await Ride.findByIdAndUpdate(
        rideId,
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            rating,
            comment,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!ride) {
        throw new NotFoundError('Ride not found', {
          context: { rideId },
          fingerprint: ['rideshare', 'ride', 'not_found']
        });
      }

      const duration = performance.now() - startTime;
      logger.info(`Ride completed successfully in ${duration}ms`, { rideId });

      return ride;
    } catch (error: unknown) {
      logger.error('Failed to complete ride', { error, rideId });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to complete ride', {
        context: { operation: 'completeRide', rideId, error: error instanceof Error ? error.message : String(error) },
        fingerprint: ['rideshare', 'ride', 'complete_error']
      });
    }
  }
} 