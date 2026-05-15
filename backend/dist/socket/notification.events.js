import { userRoom } from './booking.events.js';
let io = null;
export const setNotificationSocketServer = (server) => {
    io = server;
};
const emitNotification = (event, notification) => {
    if (!io)
        return;
    io.to(userRoom(notification.userId)).emit(event, { notification });
};
export const emitNotificationCreated = (notification) => {
    emitNotification('notification:new', notification);
};
export const emitNotificationUpdated = (notification) => {
    emitNotification('notification:updated', notification);
};
