let io = null;
export const userRoom = (userId) => `user:${String(userId)}`;
export const setBookingSocketServer = (server) => {
    io = server;
};
export const emitBookingUpdated = ({ studentUserId, mentorUserId, booking, }) => {
    if (!io)
        return;
    const rooms = new Set([userRoom(studentUserId)]);
    if (mentorUserId) {
        rooms.add(userRoom(mentorUserId));
    }
    for (const room of rooms) {
        io.to(room).emit('booking:updated', { booking });
    }
};
