import type { Server } from 'socket.io';

let io: Server | null = null;

export const userRoom = (userId: bigint | string) => `user:${String(userId)}`;

export const setBookingSocketServer = (server: Server) => {
  io = server;
};

export const emitBookingUpdated = ({
  studentUserId,
  mentorUserId,
  booking,
}: {
  studentUserId: bigint;
  mentorUserId: bigint | null;
  booking: unknown;
}) => {
  if (!io) return;

  const rooms = new Set([userRoom(studentUserId)]);
  if (mentorUserId) {
    rooms.add(userRoom(mentorUserId));
  }

  for (const room of rooms) {
    io.to(room).emit('booking:updated', { booking });
  }
};
