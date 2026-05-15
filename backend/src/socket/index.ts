import type { Server as HttpServer } from 'node:http';

import { Server } from 'socket.io';

import { authConfig } from '../config/auth.js';
import { logger } from '../utils/logger.js';
import { authenticateSocket, type AuthenticatedSocket } from './auth.js';
import { registerChatHandlers } from './chat.handlers.js';
import { setBookingSocketServer, userRoom } from './booking.events.js';
import { setNotificationSocketServer } from './notification.events.js';

const isAllowedOrigin = (origin: string) => (
  authConfig.allowedOrigins.includes(origin) ||
  authConfig.localDevOriginPatterns.some((pattern) => pattern.test(origin))
);

export const initializeSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Socket.IO CORS origin ${origin} is not allowed`));
      },
      credentials: true,
    },
  });

  setBookingSocketServer(io);
  setNotificationSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      (socket as AuthenticatedSocket).user = user;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    logger.info('Socket connected', {
      socketId: authenticatedSocket.id,
      userId: String(authenticatedSocket.user.id),
    });

    void authenticatedSocket.join(userRoom(authenticatedSocket.user.id));
    registerChatHandlers(io, authenticatedSocket);

    authenticatedSocket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: authenticatedSocket.id,
        userId: String(authenticatedSocket.user.id),
        reason,
      });
    });
  });

  return io;
};
