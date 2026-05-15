import type { NotificationType, Prisma } from '@prisma/client';
import type { Server } from 'socket.io';

import { userRoom } from './booking.events.js';

export type SerializedNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Prisma.JsonValue;
  dedupeKey: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isRead: boolean;
};

let io: Server | null = null;

export const setNotificationSocketServer = (server: Server) => {
  io = server;
};

const emitNotification = (event: 'notification:new' | 'notification:updated', notification: SerializedNotification) => {
  if (!io) return;

  io.to(userRoom(notification.userId)).emit(event, { notification });
};

export const emitNotificationCreated = (notification: SerializedNotification) => {
  emitNotification('notification:new', notification);
};

export const emitNotificationUpdated = (notification: SerializedNotification) => {
  emitNotification('notification:updated', notification);
};
