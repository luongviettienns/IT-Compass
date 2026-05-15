import * as bookingService from '../services/booking.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';
import { requireAuthenticatedUser } from '../utils/requireUser.js';
const parseBookingId = (value) => {
    if (typeof value !== 'string' || !value) {
        throw new HttpError(400, 'Booking id is required', undefined, 'BOOKING_ID_REQUIRED');
    }
    return BigInt(value);
};
export const getPublicBookingConfig = asyncHandler(async (req, res) => {
    const result = await bookingService.getPublicBookingConfig({ slug: String(req.params.slug) });
    return res.status(200).json(result);
});
export const getPublicAvailability = asyncHandler(async (req, res) => {
    const query = req.query;
    const result = await bookingService.getPublicAvailability({
        slug: String(req.params.slug),
        date: query.date,
        durationMinute: query.durationMinute,
    });
    return res.status(200).json(result);
});
export const createBooking = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.createBooking({
        userId: user.id,
        slug: String(req.params.slug),
        input: req.body,
    });
    return res.status(201).json({
        message: 'Booking request created successfully',
        booking,
    });
});
export const listStudentBookings = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.listStudentBookings({
        userId: user.id,
        query: req.query,
    });
    return res.status(200).json(result);
});
export const getStudentBookingDetail = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.getStudentBookingDetail({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
    });
    return res.status(200).json({ booking });
});
export const cancelStudentBooking = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.cancelStudentBooking({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
        input: req.body,
    });
    return res.status(200).json({
        message: 'Booking cancelled successfully',
        booking,
    });
});
export const getMentorAvailability = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.getMentorAvailability({ userId: user.id });
    return res.status(200).json(result);
});
export const updateMentorAvailability = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.updateMentorAvailability({
        userId: user.id,
        input: req.body,
    });
    return res.status(200).json({
        message: 'Mentor availability updated successfully',
        ...result,
    });
});
export const getMentorBookingSettings = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.getMentorBookingSettings({ userId: user.id });
    return res.status(200).json(result);
});
export const updateMentorBookingSettings = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.updateMentorBookingSettings({
        userId: user.id,
        input: req.body,
    });
    return res.status(200).json({
        message: 'Mentor booking settings updated successfully',
        ...result,
    });
});
export const listMentorBookings = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const result = await bookingService.listMentorBookings({
        userId: user.id,
        query: req.query,
    });
    return res.status(200).json(result);
});
export const getMentorBookingDetail = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.getMentorBookingDetail({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
    });
    return res.status(200).json({ booking });
});
export const confirmMentorBooking = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.confirmMentorBooking({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
    });
    return res.status(200).json({
        message: 'Booking confirmed successfully',
        booking,
    });
});
export const cancelMentorBooking = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.cancelMentorBooking({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
        input: req.body,
    });
    return res.status(200).json({
        message: 'Booking cancelled successfully',
        booking,
    });
});
export const completeMentorBooking = asyncHandler(async (req, res) => {
    const user = requireAuthenticatedUser(req);
    const booking = await bookingService.completeMentorBooking({
        userId: user.id,
        bookingId: parseBookingId(req.params.bookingId),
    });
    return res.status(200).json({
        message: 'Booking completed successfully',
        booking,
    });
});
