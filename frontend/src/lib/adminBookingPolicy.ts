import type { AdminBookingAction, MentorBooking } from './bookingApi';
import { isBookingRequestExpired } from './bookingTime';

export const adminBookingActionCopy = {
    confirm: {
        label: 'Xác nhận', title: 'Xác nhận lịch tư vấn', tone: 'success', requireReason: false,
        description: 'Xác nhận giữ lịch này và mở chat cho mentor cùng học viên. Thông báo xác nhận sẽ được gửi.',
        success: 'Đã xác nhận lịch tư vấn.',
    },
    cancel: {
        label: 'Hủy lịch', title: 'Hủy lịch tư vấn', tone: 'destructive', requireReason: true,
        description: 'Lịch sẽ được hủy bởi quản trị viên và người tham gia nhận thông báo. Nhập lý do hủy để tiếp tục.',
        success: 'Đã hủy lịch tư vấn.',
    },
    complete: {
        label: 'Hoàn thành', title: 'Xác nhận đã tư vấn', tone: 'success', requireReason: false,
        description: 'Chỉ xác nhận khi buổi tư vấn đã diễn ra. Học viên sẽ được phép đánh giá mentor sau thao tác này.',
        success: 'Đã xác nhận buổi tư vấn hoàn thành.',
    },
    'no-show': {
        label: 'Không tham dự', title: 'Xác nhận không tham dự', tone: 'destructive', requireReason: true,
        description: 'Ghi rõ căn cứ đã kiểm tra với mentor hoặc học viên. Việc hết giờ không đủ để kết luận không tham dự.',
        success: 'Đã xác nhận lịch không tham dự.',
    },
} as const;

export const getAdminBookingActions = (booking: MentorBooking, now = Date.now()): AdminBookingAction[] => {
    if (booking.status === 'REQUESTED') {
        return !isBookingRequestExpired(booking, now) && new Date(booking.startAt).getTime() > now
            ? ['confirm', 'cancel'] : [];
    }
    if (booking.status !== 'CONFIRMED') return [];
    // The server's outcome metadata and the end instant must both permit review.
    return booking.outcomeReviewRequired && new Date(booking.endAt).getTime() <= now
        ? ['complete', 'no-show', 'cancel'] : ['cancel'];
};
