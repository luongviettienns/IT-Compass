import { useEffect, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AdminBookingAction, MentorBooking } from '../../lib/bookingApi';
import { adminBookingActionCopy, getAdminBookingActions } from '../../lib/adminBookingPolicy';
import { BOOKING_TIMEZONE_LABEL, formatBookingInstant } from '../../lib/bookingTime';
import { isBookingRequestExpired } from '../../lib/bookingTime';
import { BookingStatusBadge } from '../mentor/BookingStatusBadge';
import { BookingRequestDeadline } from '../mentor/BookingRequestDeadline';
import { Button } from '../ui/Button';
import { useDialogA11y } from '../../hooks/useDialogA11y';

type Props = {
    booking: MentorBooking;
    isPending: boolean;
    isLoading: boolean;
    isRefreshing: boolean;
    isReliable: boolean;
    actionOpen: boolean;
    fallbackFocusRef: RefObject<HTMLElement | null>;
    errorMessage: string | null;
    successMessage: string | null;
    onClose: () => void;
    onReload: () => void;
    onAction: (action: AdminBookingAction) => void;
};

export function AdminBookingDetailModal({ booking, isPending, isLoading, isRefreshing, isReliable,
    actionOpen, fallbackFocusRef, errorMessage, successMessage, onClose, onReload, onAction }: Props) {
    const actions = getAdminBookingActions(booking);

    const {
        dialogRef,
        titleId,
        dialogProps,
        handleBackdropClick,
        requestClose,
    } = useDialogA11y({
        isOpen: true,
        onClose,
        isPending: isPending || actionOpen,
        closeOnEscape: !actionOpen,
        closeOnBackdropClick: !actionOpen,
    });

    useEffect(() => {
        if (!actionOpen) {
            dialogRef.current?.focus();
        }
    }, [actionOpen, dialogRef]);

    useEffect(() => {
        const fallbackFocus = fallbackFocusRef.current;
        return () => {
            fallbackFocus?.focus();
        };
    }, [fallbackFocusRef]);

    const timeline = [
        { label: 'Tạo yêu cầu', at: booking.createdAt },
        { label: 'Đã xác nhận', at: booking.confirmedAt },
        { label: 'Hết hạn xác nhận', at: booking.expiredAt },
        { label: 'Đã hủy', at: booking.cancelledAt },
        { label: 'Đã hoàn thành', at: booking.completedAt },
        { label: 'Cập nhật kết quả không tham dự', at: booking.status === 'NO_SHOW' ? booking.updatedAt : null },
    ].filter((entry): entry is { label: string; at: string } => Boolean(entry.at))
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const actor = booking.cancelledBy === 'SYSTEM' ? 'Quản trị viên' : booking.cancelledBy === 'STUDENT' ? 'Học viên' : 'Mentor';

    return createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6"
            onClick={handleBackdropClick}>
            <section ref={dialogRef} {...dialogProps} aria-modal={!actionOpen}
                inert={actionOpen}
                aria-busy={isPending || isLoading} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl outline-none"
                onClick={(event) => event.stopPropagation()}>
                <header className="flex shrink-0 items-start justify-between gap-4 border-b p-5">
                    <div className="min-w-0 space-y-2">
                        <h2 id={titleId} className="text-xl font-bold">Chi tiết lịch tư vấn</h2>
                        <p className="break-all text-xs text-muted-foreground">Mã lịch: {booking.id}</p>
                        <BookingStatusBadge status={booking.status} outcomeReviewRequired={booking.outcomeReviewRequired}
                            requestExpired={isBookingRequestExpired(booking)} cancelledBy={booking.cancelledBy} />
                        <BookingRequestDeadline booking={booking} />
                    </div>
                    <button type="button" aria-label="Đóng chi tiết" disabled={isPending} onClick={requestClose}
                        className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><X size={20} /></button>
                </header>
                <div className="space-y-5 overflow-y-auto p-5">
                    {isLoading && <p role="status">Đang tải chi tiết mới nhất...</p>}
                    {errorMessage && !actionOpen && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{errorMessage}</div>}
                    {successMessage && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">{successMessage}</p>}
                    {!isReliable && !isLoading && <p className="text-sm text-muted-foreground">Thao tác tạm khóa cho đến khi tải được chi tiết mới nhất.</p>}
                    <Button variant="outline" size="sm" disabled={isPending || isRefreshing} onClick={onReload}>Tải lại chi tiết</Button>
                    <div className="rounded-xl border p-4">
                        <h3 className="font-semibold">Thời gian tư vấn</h3>
                        <p className="mt-1">{booking.date} · {booking.startTime}–{booking.endTime} · {booking.durationMinute} phút</p>
                        <p className="mt-1 text-sm text-muted-foreground">{BOOKING_TIMEZONE_LABEL}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border p-4"><h3 className="font-semibold">Mentor</h3><p className="mt-1 break-words">{booking.mentor.name}</p></div>
                        <div className="rounded-xl border p-4"><h3 className="font-semibold">Học viên</h3><p className="mt-1 break-words">{booking.student.fullName}</p><p className="break-all text-sm text-muted-foreground">{booking.student.email}</p></div>
                    </div>
                    {booking.note && <div><h3 className="font-semibold">Ghi chú từ học viên</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{booking.note}</p></div>}
                    {booking.cancelledAt && <div><h3 className="font-semibold">{actor} đã hủy lịch</h3><p className="mt-1 whitespace-pre-wrap break-words text-sm">{booking.cancelReason || 'Không có lý do được ghi lại.'}</p></div>}
                    {booking.outcomeReviewRequired && <p className="rounded-xl bg-amber-500/10 p-3 text-sm">Buổi tư vấn đã hết giờ và cần xác nhận kết quả. Chỉ ghi nhận không tham dự sau khi đã kiểm tra thông tin với người tham gia.</p>}
                    <div><h3 className="font-semibold">Lịch sử xử lý</h3><ol className="mt-2 space-y-2 text-sm">
                        {timeline.map((entry) => <li key={entry.label}><span className="font-medium">{entry.label}</span>: {formatBookingInstant(entry.at)}</li>)}
                    </ol></div>
                </div>
                <footer className="shrink-0 space-y-3 border-t bg-secondary/10 p-5">
                    {actions.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
                        {actions.map((action) => <Button key={action} disabled={isPending || !isReliable || isRefreshing}
                            variant={action === 'cancel' || action === 'no-show' ? 'destructive' : 'default'}
                            onClick={() => onAction(action)}>{adminBookingActionCopy[action].label}</Button>)}
                    </div> : <p className="text-sm text-muted-foreground">Lịch này không còn thao tác xử lý ở trạng thái hiện tại.</p>}
                    {booking.status === 'CONFIRMED' && !booking.outcomeReviewRequired && <p className="text-sm text-muted-foreground">Các thao tác ghi nhận kết quả chỉ xuất hiện sau khi buổi tư vấn kết thúc.</p>}
                </footer>
            </section>
        </div>, document.body,
    );
}
