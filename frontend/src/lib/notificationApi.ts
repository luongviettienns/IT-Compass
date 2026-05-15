import { apiRequest } from './authApi';

export type NotificationType =
    | 'BOOKING_REQUESTED'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED_BY_STUDENT'
    | 'BOOKING_CANCELLED_BY_MENTOR'
    | 'BOOKING_COMPLETED'
    | 'BOOKING_NO_SHOW'
    | 'BOOKING_REMINDER'
    | 'SYSTEM';

export type NotificationData = {
    bookingId?: string;
    mentorUserId?: string | null;
    mentorName?: string;
    studentUserId?: string;
    studentName?: string;
    startAt?: string;
    endAt?: string;
    durationMinute?: number;
    status?: string;
    requestType?: string;
    cancelReason?: string | null;
    notificationType?: NotificationType;
    reminderMinutes?: number;
};

export type Notification = {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: NotificationData | null;
    dedupeKey: string | null;
    readAt: string | null;
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
};

export type NotificationPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type NotificationListResponse = {
    notifications: Notification[];
    unreadCount: number;
    pagination: NotificationPagination;
};

export type NotificationListParams = {
    page?: number;
    limit?: number;
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') return;
        searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
};

const request = async <T>(path: string, options: RequestInit = {}, fallbackMessage = 'Yêu cầu thông báo không thành công') =>
    apiRequest<T>(path, options, { fallbackMessage });

export const notificationApi = {
    list: (params: NotificationListParams = {}) => {
        const query = buildQueryString(params);
        return request<NotificationListResponse>(`/notifications${query}`, {}, 'Không thể tải thông báo');
    },

    getUnreadCount: () =>
        request<{ unreadCount: number }>('/notifications/unread-count', {}, 'Không thể tải số thông báo chưa đọc'),

    markAsRead: (notificationId: string) =>
        request<{ notification: Notification }>(`/notifications/${notificationId}/read`, { method: 'PATCH' }, 'Không thể đánh dấu đã đọc'),

    markAllAsRead: () =>
        request<{ updatedCount: number }>('/notifications/read-all', { method: 'PATCH' }, 'Không thể đánh dấu tất cả đã đọc'),
};
