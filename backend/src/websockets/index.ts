import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';

export const setupWebSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error: ${error}`);
    });

    // Add your WebSocket event handlers here
    socket.on('message', (data) => {
      logger.info(`Received message: ${JSON.stringify(data)}`);
      // Broadcast the message to all clients except the sender
      socket.broadcast.emit('message', data);
    });

    socket.on('typing', (data) => {
      // Broadcast typing status to all clients except the sender
      socket.broadcast.emit('typing', {
        userId: socket.id,
        isTyping: data.isTyping
      });
    });
  });
}; 