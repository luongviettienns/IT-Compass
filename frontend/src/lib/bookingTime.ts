import type { MentorBooking } from './bookingApi';

export const BOOKING_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const BOOKING_TIMEZONE_LABEL = 'Asia/Ho_Chi_Minh (UTC+07:00)';

export const todayBookingDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: BOOKING_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
};

export const formatBookingInstant = (value: string) => new Date(value).toLocaleString('vi-VN', {
    timeZone: BOOKING_TIMEZONE,
});

export const isBookingRequestExpired = (booking: Pick<MentorBooking, 'status' | 'requestExpired' | 'expiredAt' | 'responseDueAt'>) =>
    booking.status === 'REQUESTED' && (booking.requestExpired === true || Boolean(booking.expiredAt)
        || Boolean(booking.responseDueAt && new Date(booking.responseDueAt).getTime() <= Date.now()));
