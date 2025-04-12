import { WebSocketService } from '../services/websocket.service';

declare global {
  namespace Express {
    interface Request {
      wsService: WebSocketService;
    }
  }
} 