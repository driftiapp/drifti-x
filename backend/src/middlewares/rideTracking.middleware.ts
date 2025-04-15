import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { IRide, IRideUpdateResponse, rideResponseSchema } from '../types/ride';
import { performance } from 'perf_hooks';
import { WebSocketService, IRideNotification } from '../services/websocket.service';
import { AppError } from '../utils/AppError';

/**
 * Event interface for tracking ride status updates
 */
interface RideUpdateEvent {
  rideId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Middleware for tracking ride updates and sending real-time notifications
 * Implements singleton pattern for WebSocket service management
 */
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

  /**
   * Tracks ride updates and sends real-time notifications
   * @param req Express request object containing ride data
   * @param res Express response object
   * @param next Next function
   */
  public trackRideUpdates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            logger.info('Ride update tracked', { 
              event,
              path: req.path,
              method: req.method
            });

            // Send real-time notification
            middleware.sendRealTimeNotification(event, updatedRide);
          }

          // Call the original send
          return originalSend.call(this, body);
        } catch (error) {
          logger.error('Error in ride tracking middleware', { 
            error,
            path: req.path,
            method: req.method
          });
          throw new AppError('Error tracking ride update', {
            statusCode: 500,
            context: { error },
            fingerprint: ['ride', 'tracking', 'error']
          });
        }
      };

      next();
    } catch (error) {
      logger.error('Error in ride tracking setup', { 
        error,
        path: req.path,
        method: req.method
      });
      next(new AppError('Error setting up ride tracking', {
        statusCode: 500,
        context: { error },
        fingerprint: ['ride', 'tracking', 'setup-error']
      }));
    }
  };

  /**
   * Sends real-time notifications to relevant users about ride updates
   * @param event The ride update event
   * @param updatedRide The updated ride data
   */
  private sendRealTimeNotification(event: RideUpdateEvent, updatedRide: IRide): void {
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

    if (userIds.length > 0) {
      this.webSocketService.broadcastRideUpdate(notification, userIds);
      logger.debug('Real-time notification sent', { notification, userIds });
    } else {
      logger.warn('No users to notify for ride update', { 
        rideId: event.rideId,
        status: event.newStatus
      });
    }
  }
}

export const rideTrackingMiddleware = RideTrackingMiddleware.getInstance().trackRideUpdates; 