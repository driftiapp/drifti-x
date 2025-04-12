import { Types } from 'mongoose';
import { z } from 'zod';

export enum RideStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RideType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  SHARED = 'SHARED'
}

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ICurrentLocation {
  type: 'Point';
  coordinates: [number, number];
}

// Base ride interface
export interface IRide {
  _id: Types.ObjectId;
  passenger: Types.ObjectId;
  driver?: Types.ObjectId;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  currentLocation: ICurrentLocation;
  status: RideStatus;
  rideType: RideType;
  fare?: number;
  rating?: number;
  comment?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Response interfaces
export interface IRideResponse {
  success: boolean;
  data: IRide;
  timestamp: string;
}

export interface IRidesResponse {
  success: boolean;
  data: IRide[];
  timestamp: string;
}

export interface IRideUpdateResponse extends IRideResponse {
  data: IRide;
}

// Validation schemas
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional()
});

export const currentLocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()])
});

export const rideSchema = z.object({
  passenger: z.instanceof(Types.ObjectId),
  driver: z.instanceof(Types.ObjectId).optional(),
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  currentLocation: currentLocationSchema,
  status: z.nativeEnum(RideStatus),
  rideType: z.nativeEnum(RideType),
  fare: z.number().min(0).optional(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().max(500).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
});

export const rideResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    _id: z.instanceof(Types.ObjectId),
    passenger: z.instanceof(Types.ObjectId),
    driver: z.instanceof(Types.ObjectId).optional(),
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema,
    currentLocation: currentLocationSchema,
    status: z.nativeEnum(RideStatus),
    rideType: z.nativeEnum(RideType),
    fare: z.number().min(0).optional(),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().max(500).optional(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
  }),
  timestamp: z.string().datetime()
});

export const rideStatusSchema = z.object({
  status: z.nativeEnum(RideStatus)
}); 