import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
    CalendarClock,
    MessageCircle,
    Clock,
    Filter,
    ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, buttonVariants } from '../components/ui/Button';
import { BookingCancelDialog } from '../components/mentor/BookingCancelDialog';
import { BookingStatusBadge } from '../components/mentor/BookingStatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { bookingApi, getBookingStatusLabel, type BookingStatus, type MentorBooking } from '../lib/bookingApi';
import { bookingQueryKeys } from '../lib/bookingQueryKeys';
import { conversationApi } from '../lib/conversationApi';
import { formatMentorHourlyRate, getMentorHeadline } from '../lib/mentorApi';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';

const FILTERS: Array<{ label: string; status?: BookingStatus }> = [
    { label: 'Tất cả' },
    { label: 'Chờ xác nhận', status: 'REQUESTED' },
    { label: 'Đã xác nhận', status: 'CONFIRMED' },
    { label: 'Hoàn thành', status: 'COMPLETED' },
    { label: 'Đã hủy', status: 'CANCELLED_BY_STUDENT' },
];

const formatBookingDateTime = (booking: MentorBooking) => {
    const date = new Date(booking.startAt).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    return `${date}, ${booking.startTime} - ${booking.endTime}`;
};

const formatRelativeBookingTime = (booking: MentorBooking) => {
    const startTime = new Date(booking.startAt).getTime();
    if (Number.isNaN(startTime)) return '';

    const diffMs = startTime - Date.now();
    const absMinute = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
    const value = absMinute >= 1440
        ? `${Math.round(absMinute / 1440)} ngày`
        : absMinute >= 60
            ? `${Math.round(absMinute / 60)} giờ`
            : `${absMinute} phút`;

    return diffMs >= 0 ? `Còn ${value} nữa` : `Đã qua ${value}`;
};

const isCancelledBooking = (booking: MentorBooking) =>
    booking.status === 'CANCELLED_BY_STUDENT' || booking.status === 'CANCELLED_BY_MENTOR';

const canCancelBooking = (booking: MentorBooking) =>
    booking.status === 'REQUESTED' || booking.status === 'CONFIRMED';

const getStudentChatStatusText = (booking: MentorBooking) => {
    switch (booking.status) {
        case 'REQUESTED':
            return 'Chat sẽ mở sau khi mentor xác nhận lịch.';
        case 'CONFIRMED':
            return 'Chat đã sẵn sàng. Bạn có thể mở cuộc trò chuyện với mentor.';
        case 'COMPLETED':
            return 'Buổi tư vấn đã hoàn thành; chat đã kết thúc và chỉ còn lịch sử để xem lại.';
        default:
            return 'Lịch đã hủy nên không thể mở chat mới.';
    }
};

export default function StudentBookingsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'MENTOR' && location.pathname === '/bookings') {
            navigate('/mentor/bookings', { replace: true });
        }
    }, [location.pathname, navigate, user?.role]);
    const [selectedStatus, setSelectedStatus] = useState<BookingStatus | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [bookingToCancel, setBookingToCancel] = useState<MentorBooking | null>(null);
    const [openingChatBookingId, setOpeningChatBookingId] = useState('');

    const params = useMemo(() => ({
        status: selectedStatus,
        page,
        limit: 10,
    }), [selectedStatus, page]);

    const bookingsQuery = useQuery({
        queryKey: bookingQueryKeys.studentBookings(params),
        queryFn: () => bookingApi.listStudentBookings(params),
        enabled: user?.role === 'STUDENT',
    });

    const cancelMutation = useMutation({
        mutationFn: ({ booking, reason }: { booking: MentorBooking; reason: string }) =>
            bookingApi.cancelStudentBooking(booking.id, reason),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.studentRoot });
            setBookingToCancel(null);
            toast.success('Đã hủy lịch tư vấn.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể hủy lịch tư vấn.'));
        },
    });

    const openStudentChat = useCallback(async (booking: MentorBooking) => {
        setOpeningChatBookingId(booking.id);
        try {
            const { conversation } = await conversationApi.getBookingConversation(booking.id);
            navigate(`/messages?conversationId=${conversation.id}`);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Không thể mở cuộc trò chuyện.'));
        } finally {
            setOpeningChatBookingId('');
        }
    }, [navigate]);

    const bookings = bookingsQuery.data?.bookings ?? [];
    const pagination = bookingsQuery.data?.pagination;

    return (
        <>
            <Helmet>
                <title>Lịch tư vấn — IT Compass</title>
                <meta name="description" content="Theo dõi lịch tư vấn với mentor, quản lý các buổi hẹn đã đặt và sắp tới." />
            </Helmet>

            <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card className="rounded-[32px] border-border/70 shadow-xl shadow-primary/5">
                        <CardHeader className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <CalendarClock size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-3xl font-black tracking-tight">Lịch tư vấn của bạn</CardTitle>
                                    <CardDescription className="text-sm leading-6">
                                        Theo dõi lịch hẹn với mentor, mở chat và quản lý các buổi tư vấn.
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <Filter size={14} className="shrink-0 text-muted-foreground" />
                                {FILTERS.map((filter) => (
                                    <button
                                        key={filter.label}
                                        onClick={() => { setSelectedStatus(filter.status); setPage(1); }}
                                        className={cn(
                                            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                                            selectedStatus === filter.status
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground',
                                        )}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {bookingsQuery.isLoading ? (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-56 rounded-[24px]" />
                                    ))}
                                </div>
                            ) : bookingsQuery.error ? (
                                <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                                    {getErrorMessage(bookingsQuery.error, 'Không thể tải lịch tư vấn.')}
                                </div>
                            ) : bookings.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarClock size={24} />}
                                    title={selectedStatus ? `Không có lịch ${getBookingStatusLabel(selectedStatus).toLowerCase()}` : 'Chưa có lịch tư vấn'}
                                    description={selectedStatus ? 'Thử chọn bộ lọc khác.' : 'Đặt lịch với mentor để bắt đầu hành trình tư vấn.'}
                                    action={
                                        !selectedStatus ? (
                                            <Link to="/mentors" className={buttonVariants({ variant: 'outline' })}>
                                                Tìm mentor phù hợp
                                            </Link>
                                        ) : undefined
                                    }
                                />
                            ) : (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {bookings.map((booking) => (
                                        <article key={booking.id} className="rounded-[24px] border border-border/60 bg-background p-5 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex min-w-0 gap-4">
                                                    <Avatar src={booking.mentor.avatarUrl} alt={booking.mentor.name} size="lg" />
                                                    <div className="min-w-0">
                                                        <h3 className="text-base font-semibold text-foreground">{booking.mentor.name}</h3>
                                                        <p className="mt-1 text-sm text-muted-foreground">{getMentorHeadline(booking.mentor)}</p>
                                                        <Badge variant="outline" className={cn(
                                                            'mt-2 border-border/70 px-3 py-1 text-xs font-semibold',
                                                            booking.requestType === 'CUSTOM_TIME' ? 'border-primary/30 bg-primary/10 text-primary' : 'bg-surface/50 text-muted-foreground',
                                                        )}>
                                                            {booking.requestType === 'CUSTOM_TIME' ? 'Đề xuất giờ riêng' : 'Theo lịch mentor'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <BookingStatusBadge status={booking.status} />
                                            </div>

                                            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                                                <div className="rounded-2xl border border-border/60 bg-surface/30 p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Thời gian</p>
                                                    <p className="mt-1 font-medium text-foreground">{formatBookingDateTime(booking)}</p>
                                                    <p className="mt-1 text-xs text-primary">{formatRelativeBookingTime(booking)}</p>
                                                </div>
                                                <div className="rounded-2xl border border-border/60 bg-surface/30 p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Chi tiết</p>
                                                    <p className="mt-1 font-medium text-foreground">{booking.durationMinute} phút</p>
                                                    <p className="mt-1 text-xs">{formatMentorHourlyRate(booking.mentor.hourlyRate)} / buổi</p>
                                                </div>
                                            </div>

                                            {booking.requestType === 'CUSTOM_TIME' && booking.status === 'REQUESTED' && (
                                                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-primary">
                                                    Bạn đã đề xuất một khung giờ riêng. Mentor sẽ xác nhận nếu thời gian này phù hợp.
                                                </div>
                                            )}

                                            {(booking.note || (isCancelledBooking(booking) && booking.cancelReason)) && (
                                                <div className="mt-4 space-y-2 rounded-2xl border border-border/60 bg-background p-4 text-sm leading-6 text-muted-foreground">
                                                    {booking.note && <p className="line-clamp-2">Ghi chú của bạn: {booking.note}</p>}
                                                    {isCancelledBooking(booking) && (
                                                        <p className="text-destructive">
                                                            Lý do hủy: {booking.cancelReason || 'Chưa có lý do cụ thể.'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-4 rounded-2xl border border-border/60 bg-surface/30 p-4 text-sm leading-6 text-muted-foreground">
                                                <Clock size={14} className="inline mr-1 -mt-0.5" />
                                                {getStudentChatStatusText(booking)}
                                            </div>

                                            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                                <Link to={`/mentors/${booking.mentor.slug}`} className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 justify-center')}>
                                                    Xem mentor
                                                </Link>
                                                {booking.status === 'CONFIRMED' && (
                                                    <Button
                                                        type="button"
                                                        className="flex-1"
                                                        isLoading={openingChatBookingId === booking.id}
                                                        onClick={() => void openStudentChat(booking)}
                                                    >
                                                        <MessageCircle size={16} /> Mở chat
                                                    </Button>
                                                )}
                                                {canCancelBooking(booking) && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="flex-1"
                                                        isLoading={cancelMutation.isPending && cancelMutation.variables?.booking.id === booking.id}
                                                        onClick={() => setBookingToCancel(booking)}
                                                    >
                                                        Hủy lịch
                                                    </Button>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    >
                                        Trước
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Trang {pagination.page} / {pagination.totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page >= pagination.totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                    >
                                        Sau <ArrowRight size={14} />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </main>

            {bookingToCancel && (
                <BookingCancelDialog
                    booking={bookingToCancel}
                    title="Bạn muốn hủy lịch tư vấn này?"
                    description="Vui lòng nhập lý do hủy để mentor biết. Hành động này không thể hoàn tác."
                    onClose={() => setBookingToCancel(null)}
                    onConfirm={(_booking, reason) => cancelMutation.mutate({ booking: bookingToCancel, reason })}
                    isPending={cancelMutation.isPending}
                />
            )}
        </>
    );
}
