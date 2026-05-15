import { io, type Socket } from 'socket.io-client';

import { API_ORIGIN, authTokenStore } from './authApi';
import type { MentorBooking } from './bookingApi';
import type { ConversationMessage } from './conversationApi';
import type { Notification } from './notificationApi';

export type ChatSocketServerEvents = {
    'booking:updated': (payload: { booking: MentorBooking }) => void;
    'message:new': (message: ConversationMessage) => void;
    'conversation:updated': (payload: { conversationId: string; latestMessage: ConversationMessage }) => void;
    'message:error': (payload: { message: string; code: string; details?: unknown }) => void;
    'message:typing': (payload: { conversationId: string; userId: string; isTyping: boolean }) => void;
    'notification:new': (payload: { notification: Notification }) => void;
    'notification:updated': (payload: { notification: Notification }) => void;
};

export type ChatSocketClientEvents = {
    'conversation:join': (payload: { conversationId: string }) => void;
    'conversation:leave': (payload: { conversationId: string }) => void;
    'message:send': (
        payload: { conversationId: string; content: string },
        acknowledge?: (response: { ok: true; message: ConversationMessage } | { ok: false; error: unknown }) => void,
    ) => void;
    'message:typing': (payload: { conversationId: string; isTyping: boolean }) => void;
};

export type ChatSocket = Socket<ChatSocketServerEvents, ChatSocketClientEvents>;

let chatSocket: ChatSocket | null = null;

export const getChatSocket = () => {
    const token = authTokenStore.get();
    if (!token) return null;

    if (!chatSocket) {
        chatSocket = io(API_ORIGIN, {
            autoConnect: false,
            withCredentials: true,
            auth: { token },
        });
    }

    chatSocket.auth = { token };
    if (!chatSocket.connected) {
        chatSocket.connect();
    }

    return chatSocket;
};

export const disconnectChatSocket = () => {
    chatSocket?.disconnect();
    chatSocket = null;
};
