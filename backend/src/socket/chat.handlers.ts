import type { Server } from 'socket.io';
import { z } from 'zod';

import * as conversationService from '../services/conversation.service.js';
import { HttpError, isHttpError } from '../utils/httpError.js';
import type { AuthenticatedSocket } from './auth.js';

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

const conversationRoom = (conversationId: bigint) => `conversation:${String(conversationId)}`;

const parseBigIntId = (value: string, code: string) => {
  try {
    return BigInt(value);
  } catch {
    throw new HttpError(400, 'Invalid numeric id', undefined, code);
  }
};

const emitSocketError = (socket: AuthenticatedSocket, error: unknown) => {
  const payload = isHttpError(error)
    ? { message: error.message, code: error.code, details: error.details }
    : { message: 'Chat event failed', code: 'CHAT_EVENT_FAILED' };

  socket.emit('message:error', payload);
};

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  socket.on('conversation:join', async (payload: unknown) => {
    try {
      const input = conversationIdSchema.parse(payload);
      const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
      await conversationService.getConversationForAccess(conversationId, socket.user.id);
      await socket.join(conversationRoom(conversationId));
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on('conversation:leave', async (payload: unknown) => {
    try {
      const input = conversationIdSchema.parse(payload);
      const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
      await socket.leave(conversationRoom(conversationId));
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on('message:send', async (payload: unknown, acknowledge?: (response: unknown) => void) => {
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
    } catch (error) {
      emitSocketError(socket, error);
      acknowledge?.({ ok: false, error: isHttpError(error) ? error.toResponseBody() : { message: 'Chat event failed', code: 'CHAT_EVENT_FAILED' } });
    }
  });

  socket.on('message:typing', async (payload: unknown) => {
    try {
      const input = typingSchema.parse(payload);
      const conversationId = parseBigIntId(input.conversationId, 'CONVERSATION_ID_REQUIRED');
      await conversationService.getConversationForAccess(conversationId, socket.user.id);
      socket.to(conversationRoom(conversationId)).emit('message:typing', {
        conversationId: input.conversationId,
        userId: String(socket.user.id),
        isTyping: input.isTyping,
      });
    } catch (error) {
      emitSocketError(socket, error);
    }
  });
};
