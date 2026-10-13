import { HttpError } from '../utils/httpError.js';
// The approved MVP calendar is Vietnam only (UTC+07:00, without DST).
// Calendar dates must never depend on the Node process timezone.
export const BOOKING_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const REQUEST_RESPONSE_WINDOW_HOUR = 24;
const BUSINESS_OFFSET_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;
const pad2 = (value) => String(value).padStart(2, '0');
export const formatDate = (instant) => {
    const wall = new Date(instant.getTime() + BUSINESS_OFFSET_MS);
    return `${wall.getUTCFullYear()}-${pad2(wall.getUTCMonth() + 1)}-${pad2(wall.getUTCDate())}`;
};
export const formatTime = (instant) => {
    const wall = new Date(instant.getTime() + BUSINESS_OFFSET_MS);
    return `${pad2(wall.getUTCHours())}:${pad2(wall.getUTCMinutes())}`;
};
export const parseDateBoundary = (date, mode) => {
    const [year, month, day] = date.split('-').map(Number);
    const wall = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
        || wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1 || wall.getUTCDate() !== day) {
        throw new HttpError(400, 'Invalid booking date', undefined, 'BOOKING_INVALID_DATE_TIME');
    }
    return new Date(wall.getTime() - BUSINESS_OFFSET_MS + (mode === 'end' ? DAY_MS : 0));
};
export const parseLocalDateTime = ({ date, startTime, durationMinute }) => {
    const dayStartAt = parseDateBoundary(date, 'start');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
        throw new HttpError(400, 'Invalid booking time', undefined, 'BOOKING_INVALID_DATE_TIME');
    }
    const [hour, minute] = startTime.split(':').map(Number);
    const startMinute = hour * 60 + minute;
    const endMinute = startMinute + durationMinute;
    if (endMinute > 1440) {
        throw new HttpError(400, 'Booking must end within the selected date', undefined, 'BOOKING_ENDS_NEXT_DAY');
    }
    const startAt = new Date(dayStartAt.getTime() + startMinute * 60_000);
    return {
        startAt, endAt: new Date(startAt.getTime() + durationMinute * 60_000),
        weekday: new Date(`${date}T00:00:00Z`).getUTCDay(), startMinute, endMinute,
    };
};
export const getResponseDueAt = (booking) => booking.responseDueAt ?? new Date(Math.min(booking.startAt.getTime(), booking.createdAt.getTime() + REQUEST_RESPONSE_WINDOW_HOUR * 3_600_000));
export const isRequestExpired = (booking, now = new Date()) => booking.status === 'REQUESTED'
    && (booking.expiredAt !== null || getResponseDueAt(booking).getTime() <= now.getTime()
        || booking.startAt.getTime() <= now.getTime());
