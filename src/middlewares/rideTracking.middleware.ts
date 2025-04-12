import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import * as Sentry from '@sentry/node';
import { IRide, IRideUpdateResponse, rideResponseSchema } from '../types/ride';
import { performance } from 'perf_hooks';
import { Types } from 'mongoose';
import { WebSocketService, IRideNotification } from '../services/websocket.service';

interface RideUpdateEvent {
  rideId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class RideTrackingMiddleware {
  private static instance: RideTrackingMiddleware;
  private webSocketService: WebSocketService;

  private constructor() {
    this.webSocketService = WebSocketService.getInstance();
  }

  public static getInstance(): RideTrackingMiddleware {
    if (!RideTrackingMiddleware.instance) {
      RideTrackingMiddleware.instance = new RideTrackingMiddleware();
    }
    return RideTrackingMiddleware.instance;
  }

  public trackRideUpdates = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    const originalSend = res.send;
    const middleware = this;

    try {
      // Store the original ride data before update
      const previousRide = req.body.previousRide as IRide;
      
      // Override res.send to intercept the response
      res.send = function (body: any) {
        try {
          const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
          
          // Validate the response using Zod
          const validationResult = rideResponseSchema.safeParse(parsedBody);
          
          if (previousRide && validationResult.success && validationResult.data.data) {
            const updatedRide = validationResult.data.data as IRide;
            const event: RideUpdateEvent = {
              rideId: updatedRide._id.toString(),
              previousStatus: previousRide.status,
              newStatus: updatedRide.status,
              timestamp: new Date().toISOString(),
              metadata: {
                duration: performance.now() - startTime,
                location: updatedRide.currentLocation,
                driver: updatedRide.driver,
                fare: updatedRide.fare
              }
            };

            // Log the event
            logger.info('Ride update tracked', { event });

            // Send to Sentry for monitoring
            Sentry.addBreadcrumb({
              category: 'ride.update',
              message: `Ride ${event.rideId} status changed from ${event.previousStatus} to ${event.newStatus}`,
              level: 'info',
              data: event
            });

            // Send real-time notification
            middleware.sendRealTimeNotification(event, updatedRide);
          }

          // Call the original send
          return originalSend.call(this, body);
        } catch (error) {
          logger.error('Error in ride tracking middleware', { error });
          return originalSend.call(this, body);
        }
      };

      next();
    } catch (error) {
      logger.error('Error in ride tracking setup', { error });
      next(error);
    }
  };

  private sendRealTimeNotification(event: RideUpdateEvent, updatedRide: IRide) {
    const notification: IRideNotification = {
      rideId: event.rideId,
      type: 'status_update',
      data: {
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
        location: updatedRide.currentLocation,
        message: `Ride status updated from ${event.previousStatus} to ${event.newStatus}`
      },
      timestamp: event.timestamp
    };

    // Send notification to both driver and passenger
    const userIds: string[] = [];
    if (updatedRide.driver) {
      userIds.push(updatedRide.driver.toString());
    }
    if (updatedRide.passenger) {
      userIds.push(updatedRide.passenger.toString());
    }

    this.webSocketService.broadcastRideUpdate(notification, userIds);
  }
}

export const rideTrackingMiddleware = RideTrackingMiddleware.getInstance().trackRideUpdates; 