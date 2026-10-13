import type { MentorBooking } from '../../lib/bookingApi';
import { BOOKING_TIMEZONE_LABEL, formatBookingInstant, isBookingRequestExpired } from '../../lib/bookingTime';

export function BookingRequestDeadline({ booking }: { booking: MentorBooking }) {
    if (booking.status !== 'REQUESTED' || !booking.responseDueAt) return null;
    return <p className="mt-2 text-sm text-muted-foreground">
        {isBookingRequestExpired(booking)
            ? 'Yêu cầu đã hết hạn xác nhận. Bạn có thể chọn một lịch mới.'
            : `Xác nhận trước ${formatBookingInstant(booking.responseDueAt)} — ${BOOKING_TIMEZONE_LABEL}.`}
    </p>;
}
