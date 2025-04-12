declare module './services/websocketService' {
  import { Server } from 'http';
  import { Server as SocketIOServer } from 'socket.io';

  const websocketService: {
    initialize: (server: Server) => void;
    stop: () => void;
    getIO: () => SocketIOServer;
  };

  export default websocketService;
} 