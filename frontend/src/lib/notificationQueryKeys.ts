import type { NotificationListParams } from './notificationApi';

export const notificationQueryKeys = {
    all: ['notifications'] as const,
    list: (params: NotificationListParams = {}) => ['notifications', 'list', params] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
};
