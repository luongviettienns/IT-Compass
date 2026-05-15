import * as conversationService from '../services/conversation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';
const parseNumericId = (value, errorCode) => {
    if (typeof value !== 'string' || !value) {
        throw new HttpError(400, 'Id is required', undefined, errorCode);
    }
    return BigInt(value);
};
export const listConversations = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await conversationService.listConversations({
        userId: user.id,
        query: req.query,
    });
    return res.status(200).json(result);
});
export const getBookingConversation = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const conversation = await conversationService.getConversationByBooking({
        userId: user.id,
        bookingId: parseNumericId(req.params.bookingId, 'BOOKING_ID_REQUIRED'),
    });
    return res.status(200).json({ conversation });
});
export const listMessages = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await conversationService.listMessages({
        userId: user.id,
        conversationId: parseNumericId(req.params.conversationId, 'CONVERSATION_ID_REQUIRED'),
        query: req.query,
    });
    return res.status(200).json(result);
});
export const createMessage = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const message = await conversationService.createMessage({
        userId: user.id,
        conversationId: parseNumericId(req.params.conversationId, 'CONVERSATION_ID_REQUIRED'),
        input: req.body,
    });
    return res.status(201).json({
        message: 'Message sent successfully',
        data: message,
    });
});
