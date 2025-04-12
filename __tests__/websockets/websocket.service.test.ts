import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketService } from '../../websockets/websocket.service';
import { INotification, NotificationType } from '../../types/websocket';
import { logger } from '../../utils/logger';

jest.mock('../../utils/logger');
jest.mock('socket.io');

describe('WebSocketService', () => {
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
      emit: jest.fn()
    };

    (SocketIOServer as unknown as jest.Mock).mockImplementation(() => mockSocketServer);
    webSocketService = WebSocketService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = WebSocketService.getInstance();
      const instance2 = WebSocketService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize the socket server', () => {
      webSocketService.initialize(mockHttpServer);
      expect(SocketIOServer).toHaveBeenCalledWith(mockHttpServer, expect.any(Object));
      expect(mockSocketServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should not reinitialize if already initialized', () => {
      webSocketService.initialize(mockHttpServer);
      webSocketService.initialize(mockHttpServer);
      expect(SocketIOServer).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendNotification', () => {
    const mockNotification: INotification = {
      id: 'test-notification-id',
      type: NotificationType.STATUS_UPDATE,
      data: {
        newStatus: 'completed'
      },
      timestamp: new Date().toISOString(),
      userIds: ['user1', 'user2']
    };

    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
      mockSocketServer.sockets.sockets.set('socket1', mockSocket);
    });

    it('should send notification to connected users', () => {
      webSocketService['connectedUsers'].set('user1', 'socket1');
      
      webSocketService.sendNotification(mockNotification);
      
      expect(mockSocketServer.to).toHaveBeenCalledWith('socket1');
      expect(mockSocketServer.emit).toHaveBeenCalledWith(
        NotificationType.STATUS_UPDATE,
        mockNotification
      );
    });

    it('should log warning for disconnected users', () => {
      webSocketService.sendNotification(mockNotification);
      
      expect(logger.warn).toHaveBeenCalledWith(
        'User not connected for notification',
        expect.objectContaining({
          userId: 'user1',
          notificationId: 'test-notification-id'
        })
      );
    });

    it('should throw error if not initialized', () => {
      const uninitializedService = WebSocketService.getInstance();
      uninitializedService['isInitialized'] = false;
      
      expect(() => {
        uninitializedService.sendNotification(mockNotification);
      }).toThrow('WebSocket service not initialized');
    });
  });

  describe('broadcastToRoom', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
    });

    it('should broadcast to room', () => {
      const testData = { message: 'test' };
      
      webSocketService.broadcastToRoom('test-room', 'test-event', testData);
      
      expect(mockSocketServer.to).toHaveBeenCalledWith('test-room');
      expect(mockSocketServer.emit).toHaveBeenCalledWith('test-event', testData);
    });

    it('should throw error if not initialized', () => {
      const uninitializedService = WebSocketService.getInstance();
      uninitializedService['isInitialized'] = false;
      
      expect(() => {
        uninitializedService.broadcastToRoom('test-room', 'test-event', {});
      }).toThrow('WebSocket service not initialized');
    });
  });

  describe('room management', () => {
    beforeEach(() => {
      webSocketService.initialize(mockHttpServer);
      mockSocketServer.sockets.sockets.set('test-socket-id', mockSocket);
    });

    it('should join room', () => {
      webSocketService.joinRoom('test-socket-id', 'test-room');
      expect(mockSocket.join).toHaveBeenCalledWith('test-room');
    });

    it('should leave room', () => {
      webSocketService.leaveRoom('test-socket-id', 'test-room');
      expect(mockSocket.leave).toHaveBeenCalledWith('test-room');
    });

    it('should handle non-existent socket for join', () => {
      webSocketService.joinRoom('non-existent', 'test-room');
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should handle non-existent socket for leave', () => {
      webSocketService.leaveRoom('non-existent', 'test-room');
      expect(mockSocket.leave).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should close the socket server', () => {
      webSocketService.initialize(mockHttpServer);
      webSocketService.stop();
      expect(mockSocketServer.close).toHaveBeenCalled();
    });
  });
}); 