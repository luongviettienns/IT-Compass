import { apiRequest } from './authApi';
import type { PublicMentor } from './mentorApi';

export type BookingStatus =
    | 'REQUESTED'
    | 'CONFIRMED'
    | 'CANCELLED_BY_STUDENT'
    | 'CANCELLED_BY_MENTOR'
    | 'COMPLETED'
    | 'NO_SHOW';

export type BookingCancellationActor = 'STUDENT' | 'MENTOR' | 'SYSTEM';
export type BookingRequestType = 'AVAILABILITY_SLOT' | 'CUSTOM_TIME';

export type BookingSettings = {
    minDurationMinute: number;
    maxDurationMinute: number;
    defaultDurationMinute: number;
    durationStepMinute: number;
    bookingNoticeHour: number;
    maxAdvanceDay: number;
    bufferBeforeMinute: number;
    bufferAfterMinute: number;
    autoConfirm: boolean;
};

export type AvailabilitySlot = {
    date: string;
    startTime: string;
    endTime: string;
    startAt: string;
    endAt: string;
    durationMinute: number;
};

export type MentorAvailabilityBlock = {
    id: string;
    weekday: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
};

export type BookingStudent = {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
};

export type MentorBooking = {
    id: string;
    status: BookingStatus;
    requestType: BookingRequestType;
    date: string;
    startTime: string;
    endTime: string;
    startAt: string;
    endAt: string;
    durationMinute: number;
    note: string | null;
    cancelReason: string | null;
    cancelledBy: BookingCancellationActor | null;
    cancelledAt: string | null;
    confirmedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    mentor: PublicMentor;
    student: BookingStudent;
};

export type BookingListParams = {
    status?: BookingStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
};

export type BookingPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type BookingListResponse = {
    bookings: MentorBooking[];
    pagination: BookingPagination;
};

export type UpdateMentorAvailabilityInput = {
    blocks: Array<{
        weekday: number;
        startTime: string;
        endTime: string;
        isActive?: boolean;
    }>;
};

export type UpdateBookingSettingsInput = Partial<Pick<
    BookingSettings,
    | 'minDurationMinute'
    | 'maxDurationMinute'
    | 'defaultDurationMinute'
    | 'bookingNoticeHour'
    | 'maxAdvanceDay'
    | 'bufferBeforeMinute'
    | 'bufferAfterMinute'
>>;

const buildQueryString = (params: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === '') return;
        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

const request = async <T>(path: string, options: RequestInit = {}, fallbackMessage = 'Yêu cầu đặt lịch không thành công') =>
    apiRequest<T>(path, options, { fallbackMessage });

export const bookingApi = {
    getPublicBookingConfig: (slug: string) =>
        request<{
            mentor: PublicMentor;
            settings: BookingSettings;
            durationOptions: number[];
        }>(`/mentors/${slug}/booking-config`, {}, 'Không thể tải cấu hình đặt lịch'),

    getPublicAvailability: (slug: string, date: string, durationMinute: number) => {
        const query = buildQueryString({ date, durationMinute });
        return request<{
            mentor: PublicMentor;
            settings: BookingSettings;
            date: string;
            durationMinute: number;
            slots: AvailabilitySlot[];
        }>(`/mentors/${slug}/availability${query}`, {}, 'Không thể tải khung giờ trống');
    },

    createBooking: (slug: string, input: { date: string; startTime: string; durationMinute: number; requestType?: BookingRequestType; note?: string | null }) =>
        request<{ message: string; booking: MentorBooking }>(
            `/mentors/${slug}/bookings`,
            {
                method: 'POST',
                body: JSON.stringify(input),
            },
            'Không thể gửi yêu cầu đặt lịch',
        ),

    listStudentBookings: (params: BookingListParams = {}) => {
        const query = buildQueryString(params);
        return request<BookingListResponse>(`/users/me/bookings${query}`, {}, 'Không thể tải lịch tư vấn của bạn');
    },

    getStudentBookingDetail: (bookingId: string) =>
        request<{ booking: MentorBooking }>(`/users/me/bookings/${bookingId}`, {}, 'Không thể tải chi tiết lịch tư vấn'),

    cancelStudentBooking: (bookingId: string, reason?: string | null) =>
        request<{ message: string; booking: MentorBooking }>(
            `/users/me/bookings/${bookingId}/cancel`,
            {
                method: 'PATCH',
                body: JSON.stringify({ reason }),
            },
            'Không thể hủy lịch tư vấn',
        ),

    getMentorAvailability: () =>
        request<{ blocks: MentorAvailabilityBlock[] }>('/mentor/availability', {}, 'Không thể tải khung giờ mentor'),

    updateMentorAvailability: (input: UpdateMentorAvailabilityInput) =>
        request<{ message: string; blocks: MentorAvailabilityBlock[] }>(
            '/mentor/availability',
            {
                method: 'PUT',
                body: JSON.stringify(input),
            },
            'Không thể cập nhật khung giờ mentor',
        ),

    getMentorBookingSettings: () =>
        request<{
            settings: BookingSettings;
            durationOptions: number[];
        }>('/mentor/booking-settings', {}, 'Không thể tải cài đặt đặt lịch'),

    updateMentorBookingSettings: (input: UpdateBookingSettingsInput) =>
        request<{
            message: string;
            settings: BookingSettings;
            durationOptions: number[];
        }>(
            '/mentor/booking-settings',
            {
                method: 'PATCH',
                body: JSON.stringify(input),
            },
            'Không thể cập nhật cài đặt đặt lịch',
        ),

    listMentorBookings: (params: BookingListParams = {}) => {
        const query = buildQueryString(params);
        return request<BookingListResponse>(`/mentor/bookings${query}`, {}, 'Không thể tải danh sách lịch tư vấn');
    },

    getMentorBookingDetail: (bookingId: string) =>
        request<{ booking: MentorBooking }>(`/mentor/bookings/${bookingId}`, {}, 'Không thể tải chi tiết lịch tư vấn'),

    confirmMentorBooking: (bookingId: string) =>
        request<{ message: string; booking: MentorBooking }>(
            `/mentor/bookings/${bookingId}/confirm`,
            { method: 'PATCH' },
            'Không thể xác nhận lịch tư vấn',
        ),

    cancelMentorBooking: (bookingId: string, reason?: string | null) =>
        request<{ message: string; booking: MentorBooking }>(
            `/mentor/bookings/${bookingId}/cancel`,
            {
                method: 'PATCH',
                body: JSON.stringify({ reason }),
            },
            'Không thể hủy lịch tư vấn',
        ),

    completeMentorBooking: (bookingId: string) =>
        request<{ message: string; booking: MentorBooking }>(
            `/mentor/bookings/${bookingId}/complete`,
            { method: 'PATCH' },
            'Không thể đánh dấu hoàn thành lịch tư vấn',
        ),
};

export const getBookingStatusLabel = (status: BookingStatus) => {
    switch (status) {
        case 'REQUESTED': return 'Chờ mentor xác nhận';
        case 'CONFIRMED': return 'Đã xác nhận';
        case 'CANCELLED_BY_STUDENT': return 'Học viên đã hủy';
        case 'CANCELLED_BY_MENTOR': return 'Mentor đã hủy';
        case 'COMPLETED': return 'Đã hoàn thành';
        case 'NO_SHOW': return 'Không tham dự';
        default: return status;
    }
};
