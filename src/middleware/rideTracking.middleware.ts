import { Request, Response, NextFunction } from 'express';
import { WebSocketService } from '../services/websocket.service';

export const rideTrackingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the WebSocket service instance
  const wsService = WebSocketService.getInstance();

  // Attach the WebSocket service to the request object
  req.wsService = wsService;

  next();
}; 