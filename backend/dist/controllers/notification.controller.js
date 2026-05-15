import * as notificationService from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';
const parseNotificationId = (value) => {
    if (typeof value !== 'string' || !value) {
        throw new HttpError(400, 'Notification id is required', undefined, 'NOTIFICATION_ID_REQUIRED');
    }
    return BigInt(value);
};
export const listNotifications = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await notificationService.listNotifications({
        userId: user.id,
        query: req.query,
    });
    return res.status(200).json(result);
});
export const getUnreadCount = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await notificationService.getUnreadNotificationCount({ userId: user.id });
    return res.status(200).json(result);
});
export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const notification = await notificationService.markNotificationAsRead({
        userId: user.id,
        notificationId: parseNotificationId(req.params.notificationId),
    });
    return res.status(200).json({
        message: 'Notification marked as read',
        notification,
    });
});
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await notificationService.markAllNotificationsAsRead({ userId: user.id });
    return res.status(200).json({
        message: 'All notifications marked as read',
        ...result,
    });
});
