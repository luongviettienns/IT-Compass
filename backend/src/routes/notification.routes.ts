import { Router } from 'express';

import * as notificationController from '../controllers/notification.controller.js';
import { requireActiveUser, requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { listNotificationsSchema, notificationActionSchema } from '../validators/notification.validator.js';

const notificationRoutes = Router();

notificationRoutes.use(requireAuth, requireActiveUser);
notificationRoutes.get('/', validate(listNotificationsSchema), notificationController.listNotifications);
notificationRoutes.get('/unread-count', notificationController.getUnreadCount);
notificationRoutes.patch('/read-all', notificationController.markAllNotificationsAsRead);
notificationRoutes.patch('/:notificationId/read', validate(notificationActionSchema), notificationController.markNotificationAsRead);

export default notificationRoutes;
