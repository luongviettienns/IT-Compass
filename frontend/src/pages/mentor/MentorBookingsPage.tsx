import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { CalendarCheck2, CheckCircle2, Clock3, MessageCircle, Search, UserRound, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { BookingCancelDialog } from '../../components/mentor/BookingCancelDialog';
import { BookingStatusBadge } from '../../components/mentor/BookingStatusBadge';
import { bookingApi, type BookingListParams, type BookingStatus, type MentorBooking } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { conversationApi } from '../../lib/conversationApi';
import { getErrorMessage } from '../../lib/appError';
import { cn } from '../../lib/utils';

const FILTERS: Array<{ label: string; status?: BookingStatus }> = [
    { label: 'Tất cả' },
    { label: 'Chờ xác nhận', status: 'REQUESTED' },
    { label: 'Đã xác nhận', status: 'CONFIRMED' },
    { label: 'Hoàn thành', status: 'COMPLETED' },
    { label: 'Học viên hủy', status: 'CANCELLED_BY_STUDENT' },
    { label: 'Mentor hủy', status: 'CANCELLED_BY_MENTOR' },
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

const canCompleteBooking = (booking: MentorBooking) => booking.status === 'CONFIRMED' && new Date(booking.endAt).getTime() <= Date.now();

const getBookingRequestTypeLabel = (booking: MentorBooking) => (
    booking.requestType === 'CUSTOM_TIME' ? 'Đề xuất giờ riêng' : 'Theo lịch mentor'
);

const getChatStatusText = (booking: MentorBooking) => {
    switch (booking.status) {
        case 'REQUESTED':
            return 'Chat sẽ mở sau khi mentor xác nhận lịch.';
        case 'CONFIRMED':
            return 'Chat đã sẵn sàng. Bạn có thể mở cuộc trò chuyện với học viên.';
        case 'COMPLETED':
            return 'Buổi tư vấn đã hoàn thành; lịch sử chat sẽ được giữ để xem lại.';
        default:
            return 'Lịch đã hủy nên không thể mở chat mới.';
    }
};

function BookingCard({
    booking,
    onConfirm,
    onCancel,
    onComplete,
    onOpenChat,
    pendingActionId,
    openingChatBookingId,
}: {
    booking: MentorBooking;
    onConfirm: (booking: MentorBooking) => void;
    onCancel: (booking: MentorBooking) => void;
    onComplete: (booking: MentorBooking) => void;
    onOpenChat: (booking: MentorBooking) => void;
    pendingActionId: string;
    openingChatBookingId: string;
}) {
    const actionPending = pendingActionId === booking.id;

    return (
        <article className="rounded-[28px] border border-border/70 bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                    <Avatar src={booking.student.avatarUrl} alt={booking.student.fullName} size="lg" />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">{booking.student.fullName}</h2>
                            <BookingStatusBadge status={booking.status} />
                            <Badge variant="outline" className={cn(
                                'border-border/70 px-3 py-1 text-xs font-semibold',
                                booking.requestType === 'CUSTOM_TIME' ? 'border-primary/30 bg-primary/10 text-primary' : 'bg-surface/50 text-muted-foreground',
                            )}>
                                {getBookingRequestTypeLabel(booking)}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{booking.student.email}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="gap-1 border-border/70 bg-surface/50 px-3 py-1">
                                <Clock3 size={14} /> {formatBookingDateTime(booking)}
                            </Badge>
                            <Badge variant="outline" className="border-border/70 bg-surface/50 px-3 py-1">
                                {booking.durationMinute} phút
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                    {booking.status === 'REQUESTED' && (
                        <Button type="button" size="sm" isLoading={actionPending} onClick={() => onConfirm(booking)}>
                            <CheckCircle2 size={15} /> Xác nhận
                        </Button>
                    )}
                    {canCompleteBooking(booking) && (
                        <Button type="button" size="sm" variant="secondary" isLoading={actionPending} onClick={() => onComplete(booking)}>
                            <CalendarCheck2 size={15} /> Hoàn thành
                        </Button>
                    )}
                    {booking.status === 'CONFIRMED' && (
                        <Button type="button" size="sm" isLoading={openingChatBookingId === booking.id} onClick={() => onOpenChat(booking)}>
                            <MessageCircle size={15} /> Mở chat
                        </Button>
                    )}
                    {(booking.status === 'REQUESTED' || booking.status === 'CONFIRMED') && (
                        <Button type="button" size="sm" variant="outline" isLoading={actionPending} onClick={() => onCancel(booking)}>
                            <XCircle size={15} /> Hủy
                        </Button>
                    )}
                </div>
            </div>

            {booking.requestType === 'CUSTOM_TIME' && booking.status === 'REQUESTED' && (
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-primary">
                    Học viên đề xuất thời gian ngoài lịch bạn đã mở. Nếu phù hợp, bạn có thể xác nhận để mở chat và giữ lịch này.
                </div>
            )}

            {booking.note && (
                <div className="mt-5 rounded-2xl border border-border/60 bg-surface/40 p-4 text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">Ghi chú: </span>{booking.note}
                </div>
            )}

            <div className="mt-4 rounded-2xl border border-border/60 bg-surface/30 p-4 text-sm leading-6 text-muted-foreground">
                {getChatStatusText(booking)}
            </div>

            {booking.cancelReason && (
                <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm leading-6 text-rose-700">
                    <span className="font-semibold">Lý do hủy: </span>{booking.cancelReason}
                </div>
            )}
        </article>
    );
}

export default function MentorBookingsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [status, setStatus] = useState<BookingStatus | undefined>();
    const [search, setSearch] = useState('');
    const [pendingActionId, setPendingActionId] = useState('');
    const [openingChatBookingId, setOpeningChatBookingId] = useState('');
    const [bookingToCancel, setBookingToCancel] = useState<MentorBooking | null>(null);

    const params = useMemo<BookingListParams>(() => ({ status, limit: 50 }), [status]);

    const bookingsQuery = useQuery({
        queryKey: bookingQueryKeys.mentorBookings(params),
        queryFn: () => bookingApi.listMentorBookings(params),
    });

    const filteredBookings = useMemo(() => {
        const bookings = bookingsQuery.data?.bookings ?? [];
        const keyword = search.trim().toLowerCase();
        if (!keyword) return bookings;

        return bookings.filter((booking) => (
            booking.student.fullName.toLowerCase().includes(keyword)
            || booking.student.email.toLowerCase().includes(keyword)
            || booking.note?.toLowerCase().includes(keyword)
        ));
    }, [bookingsQuery.data?.bookings, search]);

    const invalidateBookings = async () => {
        await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mentorRoot });
    };

    const confirmMutation = useMutation({
        mutationFn: (booking: MentorBooking) => bookingApi.confirmMentorBooking(booking.id),
        onMutate: (booking) => setPendingActionId(booking.id),
        onSuccess: async () => {
            await invalidateBookings();
            toast.success('Đã xác nhận lịch tư vấn.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể xác nhận lịch tư vấn.')),
        onSettled: () => setPendingActionId(''),
    });

    const cancelMutation = useMutation({
        mutationFn: ({ booking, reason }: { booking: MentorBooking; reason: string }) => bookingApi.cancelMentorBooking(booking.id, reason),
        onMutate: ({ booking }) => setPendingActionId(booking.id),
        onSuccess: async () => {
            await invalidateBookings();
            setBookingToCancel(null);
            toast.success('Đã hủy lịch tư vấn.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể hủy lịch tư vấn.')),
        onSettled: () => setPendingActionId(''),
    });

    const completeMutation = useMutation({
        mutationFn: (booking: MentorBooking) => bookingApi.completeMentorBooking(booking.id),
        onMutate: (booking) => setPendingActionId(booking.id),
        onSuccess: async () => {
            await invalidateBookings();
            toast.success('Đã đánh dấu hoàn thành lịch tư vấn.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể hoàn thành lịch tư vấn.')),
        onSettled: () => setPendingActionId(''),
    });

    const openMentorChat = async (booking: MentorBooking) => {
        setOpeningChatBookingId(booking.id);
        try {
            const { conversation } = await conversationApi.getBookingConversation(booking.id);
            navigate(`/mentor/messages?conversationId=${conversation.id}`);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Không thể mở cuộc trò chuyện.'));
        } finally {
            setOpeningChatBookingId('');
        }
    };

    return (
        <>
            <Helmet>
                <title>Lịch tư vấn — Mentor Portal — IT Compass</title>
            </Helmet>

            <div className="space-y-6 p-6 sm:p-8 lg:p-10">
                <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mentor Portal</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Lịch tư vấn</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Duyệt yêu cầu đặt lịch, theo dõi lịch đã xác nhận và hoàn thành buổi tư vấn.
                    </p>
                </motion.header>

                <Card className="rounded-[28px] border-border/70 shadow-xl shadow-primary/5">
                    <CardHeader className="space-y-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight">Danh sách booking</CardTitle>
                                <CardDescription className="mt-2 text-sm leading-6">
                                    Booking mới luôn ở trạng thái chờ xác nhận trước khi trở thành lịch chính thức.
                                </CardDescription>
                            </div>
                            <div className="relative w-full lg:w-80">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Tìm học viên, email, ghi chú..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map((filter) => {
                                const active = filter.status === status;
                                return (
                                    <button
                                        key={filter.label}
                                        type="button"
                                        onClick={() => setStatus(filter.status)}
                                        className={cn(
                                            'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                                            active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                                        )}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {bookingsQuery.isLoading ? (
                            <div className="space-y-4">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <Skeleton key={index} className="h-36 rounded-[28px]" />
                                ))}
                            </div>
                        ) : bookingsQuery.error ? (
                            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                {getErrorMessage(bookingsQuery.error, 'Không thể tải lịch tư vấn.')}
                            </div>
                        ) : filteredBookings.length ? (
                            <div className="space-y-4">
                                {filteredBookings.map((booking) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        pendingActionId={pendingActionId}
                                        openingChatBookingId={openingChatBookingId}
                                        onConfirm={(nextBooking) => confirmMutation.mutate(nextBooking)}
                                        onCancel={setBookingToCancel}
                                        onComplete={(nextBooking) => completeMutation.mutate(nextBooking)}
                                        onOpenChat={(nextBooking) => void openMentorChat(nextBooking)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<UserRound size={28} />}
                                title="Chưa có lịch tư vấn"
                                description="Khi học viên gửi yêu cầu đặt lịch, các booking sẽ xuất hiện tại đây để bạn xác nhận."
                            />
                        )}
                    </CardContent>
                </Card>

                <BookingCancelDialog
                    booking={bookingToCancel}
                    title="Bạn muốn hủy lịch tư vấn này?"
                    description="Học viên sẽ nhìn thấy lý do hủy trong danh sách lịch tư vấn của họ."
                    reasonPlaceholder="Ví dụ: Mentor bận đột xuất, cần đổi sang khung giờ khác..."
                    isPending={cancelMutation.isPending}
                    onClose={() => setBookingToCancel(null)}
                    onConfirm={(booking, reason) => cancelMutation.mutate({ booking, reason })}
                />
            </div>
        </>
    );
}
