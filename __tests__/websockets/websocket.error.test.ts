import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketService } from '../../websockets/websocket.service';
import { INotification, NotificationType } from '../../types/websocket';
import { logger } from '../../utils/logger';

jest.mock('../../utils/logger');
jest.mock('socket.io');

describe('WebSocket Error Handling', () => {
  let webSocketService: WebSocketService;
  let mockHttpServer: jest.Mocked<Server>;
  let mockSocketServer: jest.Mocked<SocketIOServer>;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockHttpServer = {} as jest.Mocked<Server>;
    mockSocketServer = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      close: jest.fn(),
      sockets: {
        sockets: new Map()
      }
    } as any;
    
    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      on: jest.fn()
    };

    (SocketIOServer as unknown as jest.Mock).mockImplementation(() => mockSocketServer);
    webSocketService = WebSocketService.getInstance();
  });

  describe('Connection Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      webSocketService.initialize(mockHttpServer);
      
      // Simulate connection error
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      const error = new Error('Connection failed');
      await connectionHandler(mockSocket);
      
      // Simulate error event
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      
      errorHandler(error);
      
      expect(logger.error).toHaveBeenCalledWith(
        'WebSocket connection error',
        expect.objectContaining({
          socketId: 'test-socket-id',
          error: error
        })
      );
    });

    it('should handle disconnection events', async () => {
      webSocketService.initialize(mockHttpServer);
      
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler(mockSocket);
      
      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();
      
      expect(logger.info).toHaveBeenCalledWith(
        'Client disconnected',
        expect.objectContaining({
          socketId: 'test-socket-id'
        })
      );
    });
  });

  describe('Reconnection Logic', () => {
    it('should handle client reconnection', async () => {
      webSocketService.initialize(mockHttpServer);
      
      // Initial connection
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler(mockSocket);
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();
      
      // Simulate reconnection
      const newSocket = {
        ...mockSocket,
        id: 'new-socket-id'
      };
      
      await connectionHandler(newSocket);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Client reconnected',
        expect.objectContaining({
          oldSocketId: 'test-socket-id',
          newSocketId: 'new-socket-id'
        })
      );
    });

    it('should maintain user associations during reconnection', async () => {
      webSocketService.initialize(mockHttpServer);
      
      // Initial connection with user
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler({
        ...mockSocket,
        handshake: {
          query: {
            userId: 'test-user-id'
          }
        }
      });
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();
      
      // Simulate reconnection
      const newSocket = {
        ...mockSocket,
        id: 'new-socket-id',
        handshake: {
          query: {
            userId: 'test-user-id'
          }
        }
      };
      
      await connectionHandler(newSocket);
      
      // Verify user association is maintained
      const notification: INotification = {
        id: 'test-notification-id',
        type: NotificationType.STATUS_UPDATE,
        data: { message: 'test' },
        timestamp: new Date().toISOString(),
        userIds: ['test-user-id']
      };
      
      webSocketService.sendNotification(notification);
      
      expect(mockSocketServer.to).toHaveBeenCalledWith('new-socket-id');
    });
  });

  describe('Message Queue Handling', () => {
    it('should queue messages for offline users', async () => {
      webSocketService.initialize(mockHttpServer);
      
      const notification: INotification = {
        id: 'test-notification-id',
        type: NotificationType.STATUS_UPDATE,
        data: { message: 'test' },
        timestamp: new Date().toISOString(),
        userIds: ['offline-user-id']
      };
      
      webSocketService.sendNotification(notification);
      
      expect(logger.info).toHaveBeenCalledWith(
        'Message queued for offline user',
        expect.objectContaining({
          userId: 'offline-user-id',
          notificationId: 'test-notification-id'
        })
      );
    });

    it('should deliver queued messages on reconnection', async () => {
      webSocketService.initialize(mockHttpServer);
      
      // Queue a message for offline user
      const notification: INotification = {
        id: 'test-notification-id',
        type: NotificationType.STATUS_UPDATE,
        data: { message: 'test' },
        timestamp: new Date().toISOString(),
        userIds: ['offline-user-id']
      };
      
      webSocketService.sendNotification(notification);
      
      // Simulate user reconnection
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler({
        ...mockSocket,
        handshake: {
          query: {
            userId: 'offline-user-id'
          }
        }
      });
      
      // Verify queued message was delivered
      expect(mockSocketServer.to).toHaveBeenCalledWith(mockSocket.id);
      expect(mockSocketServer.emit).toHaveBeenCalledWith(
        NotificationType.STATUS_UPDATE,
        notification
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce message rate limits', async () => {
      webSocketService.initialize(mockHttpServer);
      
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler(mockSocket);
      
      // Simulate rapid message sending
      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      for (let i = 0; i < 101; i++) {
        messageHandler({ type: 'test', data: `message ${i}` });
      }
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.objectContaining({
          socketId: 'test-socket-id'
        })
      );
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Large Message Handling', () => {
    it('should handle large messages appropriately', async () => {
      webSocketService.initialize(mockHttpServer);
      
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        call => call[0] === 'connection'
      )[1];
      
      await connectionHandler(mockSocket);
      
      // Create a large message
      const largeData = 'x'.repeat(1024 * 1024); // 1MB
      
      const messageHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'message'
      )[1];
      
      messageHandler({ type: 'large-data', data: largeData });
      
      expect(logger.warn).toHaveBeenCalledWith(
        'Large message received',
        expect.objectContaining({
          socketId: 'test-socket-id',
          size: expect.any(Number)
        })
      );
    });
  });
}); 