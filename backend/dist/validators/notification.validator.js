import { z } from 'zod';
const notificationIdParamSchema = z.object({
    notificationId: z.string().regex(/^\d+$/, 'Notification id must be a numeric string'),
});
const listNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
export const listNotificationsSchema = z.object({
    query: listNotificationsQuerySchema,
});
export const notificationActionSchema = z.object({
    params: notificationIdParamSchema,
});
