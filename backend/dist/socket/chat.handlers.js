import { z } from 'zod';
import * as conversationService from '../services/conversation.service.js';
import { HttpError, isHttpError } from '../utils/httpError.js';
const conversationIdSchema = z.object({
    conversationId: z.string().regex(/^\d+$/),
});
const messageSendSchema = z.object({
    conversationId: z.string().regex(/^\d+$/),
    content: z.string().trim().min(1).max(4000),
});
const typingSchema = z.object({
    conversationId: z.string().regex(/^\d+$/),
    isTyping: z.boolean().optional().default(true),
});
const conversationRoom = (conversationId) => `conversation:${String(conversationId)}`;
const parseBigIntId = (value, code) => {
    try {
        return BigInt(value);
    }
    catch {
        throw new HttpError(400, 'Invalid numeric id', undefined, code);
    }
};
const emitSocketError = (socket, error) => {
    const payload = isHttpError(error)
        ? { message: error.message, code: error.code, details: error.details }
        : { message: 'Chat event failed', code: 'CHAT_EVENT_FAILED' };
    socket.emit('message:error', payload);
};
export const registerChatHandlers = (io, socket) => {
    socket.on('conversation:join', async (payload) => {
        try {
            const input = conversationIdSchema.parse(payload);
            const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
            await conversationService.getConversationForAccess(conversationId, socket.user.id);
            await socket.join(conversationRoom(conversationId));
        }
        catch (error) {
            emitSocketError(socket, error);
        }
    });
    socket.on('conversation:leave', async (payload) => {
        try {
            const input = conversationIdSchema.parse(payload);
            const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
            await socket.leave(conversationRoom(conversationId));
        }
        catch (error) {
            emitSocketError(socket, error);
        }
    });
    socket.on('message:send', async (payload, acknowledge) => {
        try {
            const input = messageSendSchema.parse(payload);
            const message = await conversationService.createMessage({
                userId: socket.user.id,
                conversationId: parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED'),
                input: {
                    content: input.content,
                },
            });
            io.to(conversationRoom(BigInt(message.conversationId))).emit('message:new', message);
            io.to(conversationRoom(BigInt(message.conversationId))).emit('conversation:updated', {
                conversationId: message.conversationId,
                latestMessage: message,
            });
            acknowledge?.({ ok: true, message });
        }
        catch (error) {
            emitSocketError(socket, error);
            acknowledge?.({ ok: false, error: isHttpError(error) ? error.toResponseBody() : { message: 'Chat event failed', code: 'CHAT_EVENT_FAILED' } });
        }
    });
    socket.on('message:typing', async (payload) => {
        try {
            const input = typingSchema.parse(payload);
            const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
            await conversationService.getConversationForAccess(conversationId, socket.user.id);
            socket.to(conversationRoom(conversationId)).emit('message:typing', {
                conversationId: input.conversationId,
                userId: String(socket.user.id),
                isTyping: input.isTyping,
            });
        }
        catch (error) {
            emitSocketError(socket, error);
        }
    });
};
