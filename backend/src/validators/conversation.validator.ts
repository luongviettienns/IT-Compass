import { z } from 'zod';

const numericIdSchema = z.string().regex(/^\d+$/, 'Id must be a numeric string');

export const listConversationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const getBookingConversationSchema = z.object({
  params: z.object({
    bookingId: numericIdSchema,
  }),
});

export const getConversationMessagesSchema = z.object({
  params: z.object({
    conversationId: numericIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  }),
});

export const createConversationMessageSchema = z.object({
  params: z.object({
    conversationId: numericIdSchema,
  }),
  body: z.object({
    content: z.string().trim().min(1).max(4000),
  }),
});

export type ListConversationsQuery = z.infer<typeof listConversationsSchema>['query'];
export type ListConversationMessagesQuery = z.infer<typeof getConversationMessagesSchema>['query'];
export type CreateConversationMessageBody = z.infer<typeof createConversationMessageSchema>['body'];
