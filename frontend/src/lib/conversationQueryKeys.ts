import type { ConversationListParams, ConversationMessageListParams } from './conversationApi';

const toParamsKey = (params: ConversationListParams | ConversationMessageListParams = {}) => JSON.stringify(params);

export const conversationQueryKeys = {
    all: ['conversations'] as const,
    list: (params: ConversationListParams = {}) => ['conversations', 'list', toParamsKey(params)] as const,
    booking: (bookingId: string) => ['conversations', 'booking', bookingId] as const,
    messagesRoot: (conversationId: string) => ['conversations', 'messages', conversationId] as const,
    messages: (conversationId: string, params: ConversationMessageListParams = {}) => [
        'conversations',
        'messages',
        conversationId,
        toParamsKey(params),
    ] as const,
};
