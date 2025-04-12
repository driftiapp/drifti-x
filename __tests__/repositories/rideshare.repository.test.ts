import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { RideshareRepository } from '../../repositories/rideshare.repository';
import { Ride, IRide } from '../../models/ride.model';
import { DatabaseError, NotFoundError, AppError } from '../../utils/errorHandler';
import { RideStatus, RideType, ILocation, ICurrentLocation } from '../../types/ride';
import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';

describe('RideshareRepository', () => {
  let mongoServer: MongoMemoryServer;
  let repository: RideshareRepository;
  const validRideData: Partial<IRide> = {
    passenger: new mongoose.Types.ObjectId(),
    pickupLocation: {
      address: '123 Main St',
      coordinates: [-122.4194, 37.7749]
    } as ILocation,
    dropoffLocation: {
      address: '456 Market St',
      coordinates: [-122.4058, 37.7909]
    } as ILocation,
    status: 'pending' as RideStatus,
    rideType: 'standard'
  };

  const invalidRideData = {
    passenger: 'invalid-id',
    pickupLocation: {
      address: '123 Main St',
      coordinates: [-122.4194, 37.7749]
    },
    dropoffLocation: {
      address: '456 Market St',
      coordinates: [-122.4058, 37.7909]
    },
    status: 'invalid-status',
    rideType: 'invalid-type'
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    repository = RideshareRepository.getInstance();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Ride.deleteMany({});
  });

  describe('createRide', () => {
    it('should create a ride with valid data', async () => {
      const ride = await repository.createRide(validRideData);
      expect(ride).toBeDefined();
      expect(ride.passenger).toEqual(validRideData.passenger);
      expect(ride.status).toBe('pending');
    });

    it('should throw AppError with invalid data', async () => {
      await expect(repository.createRide(invalidRideData as any)).rejects.toThrow(AppError);
    });
  });

  describe('findNearbyDrivers', () => {
    it('should find nearby available drivers', async () => {
      // Create some available drivers
      await Ride.create([
        {
          passenger: new mongoose.Types.ObjectId(),
          driver: new mongoose.Types.ObjectId(),
          pickupLocation: {
            address: "123 Test St",
            coordinates: [-73.935242, 40.730610]
          },
          dropoffLocation: {
            address: "456 Test Ave",
            coordinates: [-73.935242, 40.730610]
          },
          currentLocation: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610]
          },
          status: 'available' as RideStatus,
          rideType: 'standard' as RideType,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          passenger: new mongoose.Types.ObjectId(),
          driver: new mongoose.Types.ObjectId(),
          pickupLocation: {
            address: "789 Test Blvd",
            coordinates: [-73.935243, 40.730611]
          },
          dropoffLocation: {
            address: "321 Test Rd",
            coordinates: [-73.935243, 40.730611]
          },
          currentLocation: {
            type: 'Point',
            coordinates: [-73.935243, 40.730611]
          },
          status: 'available' as RideStatus,
          rideType: 'standard' as RideType,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const coordinates: [number, number] = [-73.935242, 40.730610];
      const drivers = await repository.findNearbyDrivers(coordinates, 1000);

      expect(drivers).toHaveLength(2);
    });

    it('should return empty array when no drivers are nearby', async () => {
      const coordinates: [number, number] = [-73.935242, 40.730610];
      const drivers = await repository.findNearbyDrivers(coordinates, 1000);

      expect(drivers).toHaveLength(0);
    });
  });

  describe('updateRideStatus', () => {
    it('should update ride status with valid data', async () => {
      const ride = await repository.createRide(validRideData) as IRide & { _id: mongoose.Types.ObjectId };
      const updatedRide = await repository.updateRideStatus(ride._id.toString(), 'accepted' as RideStatus);
      expect(updatedRide).toBeDefined();
      expect(updatedRide.status).toBe('accepted');
    });

    it('should throw AppError with invalid status', async () => {
      const ride = await repository.createRide(validRideData) as IRide & { _id: mongoose.Types.ObjectId };
      await expect(repository.updateRideStatus(ride._id.toString(), 'invalid-status' as RideStatus)).rejects.toThrow(AppError);
    });
  });

  describe('getRideById', () => {
    it('should fetch ride by ID with populated fields', async () => {
      const passengerId = new mongoose.Types.ObjectId();
      const driverId = new mongoose.Types.ObjectId();
      
      const ride = await Ride.create({
        passenger: passengerId,
        driver: driverId,
        status: 'pending' as RideStatus,
        pickupLocation: {
          address: '123 Main St',
          coordinates: [-73.935242, 40.730610] as [number, number]
        },
        dropoffLocation: {
          address: '456 Park Ave',
          coordinates: [-73.971248, 40.783060] as [number, number]
        }
      });

      const rideId = (ride as any)._id.toString();
      const fetchedRide = await repository.getRideById(rideId);

      expect(fetchedRide).toBeDefined();
      expect(fetchedRide.passenger.toString()).toBe(passengerId.toString());
      expect(fetchedRide.driver?.toString()).toBe(driverId.toString());
    });

    it('should throw NotFoundError for non-existent ride', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(repository.getRideById(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getRidesByPassenger', () => {
    it('should fetch rides for a passenger', async () => {
      const passengerId = new mongoose.Types.ObjectId();
      
      await Ride.create([
        {
          passenger: passengerId,
          status: 'completed' as RideStatus,
          pickupLocation: {
            address: '123 Main St',
            coordinates: [-73.935242, 40.730610] as [number, number]
          },
          dropoffLocation: {
            address: '456 Park Ave',
            coordinates: [-73.971248, 40.783060] as [number, number]
          }
        },
        {
          passenger: passengerId,
          status: 'pending' as RideStatus,
          pickupLocation: {
            address: '789 Broadway',
            coordinates: [-73.992332, 40.758896] as [number, number]
          },
          dropoffLocation: {
            address: '321 5th Ave',
            coordinates: [-73.978638, 40.753182] as [number, number]
          }
        }
      ]);

      const rides = await repository.getRidesByPassenger(passengerId.toString());

      expect(rides).toHaveLength(2);
    });

    it('should filter rides by status', async () => {
      const passengerId = new mongoose.Types.ObjectId();
      
      await Ride.create([
        {
          passenger: passengerId,
          status: 'completed' as RideStatus,
          pickupLocation: {
            address: '123 Main St',
            coordinates: [-73.935242, 40.730610] as [number, number]
          },
          dropoffLocation: {
            address: '456 Park Ave',
            coordinates: [-73.971248, 40.783060] as [number, number]
          }
        },
        {
          passenger: passengerId,
          status: 'pending' as RideStatus,
          pickupLocation: {
            address: '789 Broadway',
            coordinates: [-73.992332, 40.758896] as [number, number]
          },
          dropoffLocation: {
            address: '321 5th Ave',
            coordinates: [-73.978638, 40.753182] as [number, number]
          }
        }
      ]);

      const completedRides = await repository.getRidesByPassenger(passengerId.toString(), 'completed');
      expect(completedRides).toHaveLength(1);
      expect(completedRides[0].status).toBe('completed');
    });
  });

  describe('getRidesByDriver', () => {
    it('should fetch rides for a driver', async () => {
      const driverId = new mongoose.Types.ObjectId();
      
      await Ride.create([
        {
          driver: driverId,
          status: 'completed' as RideStatus,
          pickupLocation: {
            address: '123 Main St',
            coordinates: [-73.935242, 40.730610] as [number, number]
          },
          dropoffLocation: {
            address: '456 Park Ave',
            coordinates: [-73.971248, 40.783060] as [number, number]
          }
        },
        {
          driver: driverId,
          status: 'pending' as RideStatus,
          pickupLocation: {
            address: '789 Broadway',
            coordinates: [-73.992332, 40.758896] as [number, number]
          },
          dropoffLocation: {
            address: '321 5th Ave',
            coordinates: [-73.978638, 40.753182] as [number, number]
          }
        }
      ]);

      const rides = await repository.getRidesByDriver(driverId.toString());

      expect(rides).toHaveLength(2);
    });

    it('should filter rides by status', async () => {
      const driverId = new mongoose.Types.ObjectId();
      
      await Ride.create([
        {
          driver: driverId,
          status: 'completed' as RideStatus,
          pickupLocation: {
            address: '123 Main St',
            coordinates: [-73.935242, 40.730610] as [number, number]
          },
          dropoffLocation: {
            address: '456 Park Ave',
            coordinates: [-73.971248, 40.783060] as [number, number]
          }
        },
        {
          driver: driverId,
          status: 'pending' as RideStatus,
          pickupLocation: {
            address: '789 Broadway',
            coordinates: [-73.992332, 40.758896] as [number, number]
          },
          dropoffLocation: {
            address: '321 5th Ave',
            coordinates: [-73.978638, 40.753182] as [number, number]
          }
        }
      ]);

      const completedRides = await repository.getRidesByDriver(driverId.toString(), 'completed');
      expect(completedRides).toHaveLength(1);
      expect(completedRides[0].status).toBe('completed');
    });
  });

  describe('updateRideLocation', () => {
    it('should update ride location successfully', async () => {
      const ride = await Ride.create({
        passenger: new mongoose.Types.ObjectId(),
        status: 'in_progress' as RideStatus,
        pickupLocation: {
          address: '123 Main St',
          coordinates: [-73.935242, 40.730610] as [number, number]
        },
        dropoffLocation: {
          address: '456 Park Ave',
          coordinates: [-73.971248, 40.783060] as [number, number]
        }
      });

      const rideId = (ride as any)._id.toString();
      const newCoordinates: [number, number] = [-73.935243, 40.730611];
      const updatedRide = await repository.updateRideLocation(rideId, newCoordinates);

      expect(updatedRide).toBeDefined();
      expect(updatedRide.currentLocation?.coordinates).toEqual(newCoordinates);
    });

    it('should throw NotFoundError for non-existent ride', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const coordinates: [number, number] = [-73.935242, 40.730610];
      await expect(repository.updateRideLocation(nonExistentId, coordinates)).rejects.toThrow(NotFoundError);
    });
  });

  describe('completeRide', () => {
    it('should complete ride with rating and comment', async () => {
      const ride = await Ride.create({
        passenger: new mongoose.Types.ObjectId(),
        status: 'in_progress' as RideStatus,
        pickupLocation: {
          address: '123 Main St',
          coordinates: [-73.935242, 40.730610] as [number, number]
        },
        dropoffLocation: {
          address: '456 Park Ave',
          coordinates: [-73.971248, 40.783060] as [number, number]
        }
      });

      const rideId = (ride as any)._id.toString();
      const rating = 5;
      const comment = 'Great ride!';
      const completedRide = await repository.completeRide(rideId, rating, comment);

      expect(completedRide).toBeDefined();
      expect(completedRide.status).toBe('completed');
      expect(completedRide.rating).toBe(rating);
      expect(completedRide.comment).toBe(comment);
      expect(completedRide.completedAt).toBeDefined();
    });

    it('should complete ride without rating and comment', async () => {
      const ride = await Ride.create({
        passenger: new mongoose.Types.ObjectId(),
        status: 'in_progress' as RideStatus,
        pickupLocation: {
          address: '123 Main St',
          coordinates: [-73.935242, 40.730610] as [number, number]
        },
        dropoffLocation: {
          address: '456 Park Ave',
          coordinates: [-73.971248, 40.783060] as [number, number]
        }
      });

      const rideId = (ride as any)._id.toString();
      const completedRide = await repository.completeRide(rideId);

      expect(completedRide).toBeDefined();
      expect(completedRide.status).toBe('completed');
      expect(completedRide.rating).toBeUndefined();
      expect(completedRide.comment).toBeUndefined();
      expect(completedRide.completedAt).toBeDefined();
    });

    it('should throw NotFoundError for non-existent ride', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(repository.completeRide(nonExistentId)).rejects.toThrow(NotFoundError);
    });
  });
}); 