import { Server as SocketServer } from 'socket.io';
import { logger } from './utils/logger';

export const setupWebSocket = (io: SocketServer) => {
  io.on('connection', (socket) => {
    logger.info('New client connected');

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });
  });
}; 