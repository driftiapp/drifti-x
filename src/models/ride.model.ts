import mongoose, { Schema } from 'mongoose';
import { IRide, RideStatus, RideType } from '../types/ride';

const rideSchema = new Schema<IRide>(
  {
    passenger: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pickupLocation: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      address: {
        type: String,
      },
    },
    dropoffLocation: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      address: {
        type: String,
      },
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    rideType: {
      type: String,
      required: true,
      enum: Object.values(RideType),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(RideStatus),
      default: RideStatus.PENDING,
    },
    fare: {
      type: Number,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
rideSchema.index({ passenger: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
rideSchema.index({ 'dropoffLocation.coordinates': '2dsphere' });

export const Ride = mongoose.model<IRide>('Ride', rideSchema); 