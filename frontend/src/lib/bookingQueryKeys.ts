import type { BookingListParams } from './bookingApi';

const toParamsKey = (params: BookingListParams = {}) => JSON.stringify(params);

export const bookingQueryKeys = {
    all: ['bookings'] as const,
    config: (slug: string) => ['bookings', 'config', slug] as const,
    availability: (slug: string, date: string, durationMinute: number) => ['bookings', 'availability', slug, date, durationMinute] as const,
    studentRoot: ['bookings', 'student'] as const,
    studentBookings: (params: BookingListParams = {}) => ['bookings', 'student', 'list', toParamsKey(params)] as const,
    studentBookingDetail: (bookingId: string) => ['bookings', 'student', 'detail', bookingId] as const,
    mentorRoot: ['bookings', 'mentor'] as const,
    mentorAvailability: ['bookings', 'mentor', 'availability'] as const,
    mentorBookingSettings: ['bookings', 'mentor', 'settings'] as const,
    mentorBookings: (params: BookingListParams = {}) => ['bookings', 'mentor', 'list', toParamsKey(params)] as const,
    mentorBookingDetail: (bookingId: string) => ['bookings', 'mentor', 'detail', bookingId] as const,
};
