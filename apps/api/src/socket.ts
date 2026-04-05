import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { setSocketIO } from './services/notificationService';

export function setupSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Register with notification service
  setSocketIO(io);

  io.on('connection', (socket) => {
    logger.info('Socket.io client connected', { socketId: socket.id });

    // Join user-specific room for targeted events
    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info('Socket joined user room', { socketId: socket.id, userId });
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket.io client disconnected', { socketId: socket.id, reason });
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}
