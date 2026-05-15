import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { publicMentorSelect, serializePublicMentor } from '../utils/serializeMentor.js';
import { sanitizeRichText } from '../utils/sanitize.js';
const DEFAULT_PAGE = 1;
const DEFAULT_CONVERSATION_LIMIT = 20;
const DEFAULT_MESSAGE_LIMIT = 30;
const conversationSelect = {
    id: true,
    bookingId: true,
    mentorId: true,
    studentUserId: true,
    type: true,
    lastMessageAt: true,
    createdAt: true,
    updatedAt: true,
    booking: {
        select: {
            id: true,
            status: true,
            startAt: true,
            endAt: true,
            completedAt: true,
            durationMinute: true,
        },
    },
    mentor: {
        select: publicMentorSelect,
    },
    student: {
        select: {
            id: true,
            fullName: true,
            email: true,
            profile: {
                select: {
                    avatarUrl: true,
                },
            },
        },
    },
    messages: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: {
            id: true,
            conversationId: true,
            senderUserId: true,
            type: true,
            content: true,
            readAt: true,
            createdAt: true,
            updatedAt: true,
            sender: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    profile: {
                        select: {
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    },
};
const messageSelect = {
    id: true,
    conversationId: true,
    senderUserId: true,
    type: true,
    content: true,
    readAt: true,
    createdAt: true,
    updatedAt: true,
    sender: {
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profile: {
                select: {
                    avatarUrl: true,
                },
            },
        },
    },
};
const toPositiveInteger = (value, fallback) => {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
};
const normalizeConversationPagination = (query) => ({
    page: toPositiveInteger(query.page, DEFAULT_PAGE),
    limit: toPositiveInteger(query.limit, DEFAULT_CONVERSATION_LIMIT),
});
const normalizeMessagePagination = (query) => ({
    page: toPositiveInteger(query.page, DEFAULT_PAGE),
    limit: toPositiveInteger(query.limit, DEFAULT_MESSAGE_LIMIT),
});
const serializeBookingSummary = (booking) => ({
    id: String(booking.id),
    status: booking.status,
    startAt: booking.startAt,
    endAt: booking.endAt,
    completedAt: booking.completedAt,
    durationMinute: booking.durationMinute,
});
export const serializeMessage = (message) => ({
    id: String(message.id),
    conversationId: String(message.conversationId),
    senderUserId: String(message.senderUserId),
    type: message.type,
    content: message.content,
    readAt: message.readAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    sender: {
        id: String(message.sender.id),
        fullName: message.sender.fullName,
        email: message.sender.email,
        role: message.sender.role,
        avatarUrl: message.sender.profile?.avatarUrl ?? null,
    },
});
const serializeConversation = (conversation) => ({
    id: String(conversation.id),
    bookingId: String(conversation.bookingId),
    type: conversation.type,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    booking: serializeBookingSummary(conversation.booking),
    mentor: serializePublicMentor(conversation.mentor),
    student: {
        id: String(conversation.student.id),
        fullName: conversation.student.fullName,
        email: conversation.student.email,
        avatarUrl: conversation.student.profile?.avatarUrl ?? null,
    },
    latestMessage: conversation.messages[0] ? serializeMessage(conversation.messages[0]) : null,
});
const canAccessConversation = (conversation, userId) => (conversation.studentUserId === userId || conversation.mentor.userId === userId);
const canSendConversationMessage = (booking) => booking.status === 'CONFIRMED';
export const ensureConversationForConfirmedBooking = async (tx, booking) => {
    if (booking.status !== 'CONFIRMED') {
        throw new HttpError(400, 'Conversation is only available after booking confirmation', undefined, 'CONVERSATION_BOOKING_NOT_CONFIRMED');
    }
    return tx.conversation.upsert({
        where: { bookingId: booking.id },
        update: {},
        create: {
            bookingId: booking.id,
            mentorId: booking.mentorId,
            studentUserId: booking.studentUserId,
            type: 'BOOKING_DIRECT',
        },
        select: {
            id: true,
        },
    });
};
export const getConversationForAccess = async (conversationId, userId) => {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: {
            id: true,
            studentUserId: true,
            booking: {
                select: {
                    status: true,
                    completedAt: true,
                },
            },
            mentor: {
                select: {
                    userId: true,
                },
            },
        },
    });
    if (!conversation) {
        throw new HttpError(404, 'Conversation not found', undefined, 'CONVERSATION_NOT_FOUND');
    }
    if (!canAccessConversation(conversation, userId)) {
        throw new HttpError(403, 'Conversation access forbidden', undefined, 'CONVERSATION_FORBIDDEN');
    }
    return conversation;
};
export const listConversations = async ({ userId, query }) => {
    const { page, limit } = normalizeConversationPagination(query);
    const where = {
        OR: [
            { studentUserId: userId },
            { mentor: { userId } },
        ],
    };
    const [total, conversations] = await Promise.all([
        prisma.conversation.count({ where }),
        prisma.conversation.findMany({
            where,
            select: conversationSelect,
            orderBy: [{ lastMessageAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    return {
        conversations: conversations.map(serializeConversation),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
};
export const getConversationByBooking = async ({ userId, bookingId }) => {
    const booking = await prisma.mentorBooking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            mentorId: true,
            studentUserId: true,
            status: true,
            mentor: {
                select: {
                    userId: true,
                },
            },
        },
    });
    if (!booking) {
        throw new HttpError(404, 'Booking not found', undefined, 'BOOKING_NOT_FOUND');
    }
    if (!canAccessConversation(booking, userId)) {
        throw new HttpError(403, 'Booking conversation access forbidden', undefined, 'CONVERSATION_FORBIDDEN');
    }
    await prisma.$transaction((tx) => ensureConversationForConfirmedBooking(tx, booking));
    const conversation = await prisma.conversation.findUnique({
        where: { bookingId },
        select: conversationSelect,
    });
    if (!conversation) {
        throw new HttpError(404, 'Conversation not found', undefined, 'CONVERSATION_NOT_FOUND');
    }
    return serializeConversation(conversation);
};
export const listMessages = async ({ userId, conversationId, query, }) => {
    await getConversationForAccess(conversationId, userId);
    const { page, limit } = normalizeMessagePagination(query);
    const where = { conversationId };
    const [total, messages] = await Promise.all([
        prisma.message.count({ where }),
        prisma.message.findMany({
            where,
            select: messageSelect,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);
    return {
        messages: messages.reverse().map(serializeMessage),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
};
export const createMessage = async ({ userId, conversationId, input, }) => {
    const conversation = await getConversationForAccess(conversationId, userId);
    if (!canSendConversationMessage(conversation.booking)) {
        throw new HttpError(400, 'Messages can only be sent for confirmed bookings', undefined, 'CONVERSATION_BOOKING_NOT_CONFIRMED');
    }
    const content = sanitizeRichText(input.content);
    if (!content) {
        throw new HttpError(400, 'Message content is required', undefined, 'MESSAGE_CONTENT_REQUIRED');
    }
    const message = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.message.create({
            data: {
                conversationId,
                senderUserId: userId,
                type: 'TEXT',
                content,
            },
            select: messageSelect,
        });
        await tx.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: createdMessage.createdAt },
        });
        return createdMessage;
    });
    return serializeMessage(message);
};
