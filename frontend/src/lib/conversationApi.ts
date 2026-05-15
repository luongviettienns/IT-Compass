import { apiRequest } from './authApi';
import type { BookingStatus } from './bookingApi';
import type { PublicMentor } from './mentorApi';
import type { Role } from './authApi';

export type ConversationMessageSender = {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    avatarUrl: string | null;
};

export type ConversationMessage = {
    id: string;
    conversationId: string;
    senderUserId: string;
    type: 'TEXT' | 'SYSTEM';
    content: string;
    readAt: string | null;
    createdAt: string;
    updatedAt: string;
    sender: ConversationMessageSender;
};

export type Conversation = {
    id: string;
    bookingId: string;
    type: 'BOOKING_DIRECT';
    lastMessageAt: string | null;
    createdAt: string;
    updatedAt: string;
    booking: {
        id: string;
        status: BookingStatus;
        startAt: string;
        endAt: string;
        completedAt: string | null;
        durationMinute: number;
    };
    mentor: PublicMentor;
    student: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl: string | null;
    };
    latestMessage: ConversationMessage | null;
};

export type ConversationPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type ConversationListParams = {
    page?: number;
    limit?: number;
};

export type ConversationMessageListParams = {
    page?: number;
    limit?: number;
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') return;
        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

const request = async <T>(path: string, options: RequestInit = {}, fallbackMessage = 'Yêu cầu tin nhắn không thành công') =>
    apiRequest<T>(path, options, { fallbackMessage });

export const conversationApi = {
    listConversations: (params: ConversationListParams = {}) => {
        const query = buildQueryString(params);
        return request<{ conversations: Conversation[]; pagination: ConversationPagination }>(
            `/conversations${query}`,
            {},
            'Không thể tải danh sách tin nhắn',
        );
    },

    getBookingConversation: (bookingId: string) =>
        request<{ conversation: Conversation }>(
            `/bookings/${bookingId}/conversation`,
            {},
            'Không thể mở cuộc trò chuyện của lịch tư vấn',
        ),

    listMessages: (conversationId: string, params: ConversationMessageListParams = {}) => {
        const query = buildQueryString(params);
        return request<{ messages: ConversationMessage[]; pagination: ConversationPagination }>(
            `/conversations/${conversationId}/messages${query}`,
            {},
            'Không thể tải nội dung trò chuyện',
        );
    },

    createMessage: (conversationId: string, content: string) =>
        request<{ message: string; data: ConversationMessage }>(
            `/conversations/${conversationId}/messages`,
            {
                method: 'POST',
                body: JSON.stringify({ content }),
            },
            'Không thể gửi tin nhắn',
        ),
};
