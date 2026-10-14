import { BOOKING_TIMEZONE_LABEL, formatBookingInstant, isBookingRequestExpired } from '../../lib/bookingTime';
import { BookingRequestDeadline } from '../../components/mentor/BookingRequestDeadline';
import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Download, Search, Clock, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Loader } from '../../components/ui/Loader';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { AdminExportModal, type ExportScope } from '../../components/admin/AdminExportModal';
import { AdminQueryBoundary } from '../../components/admin/AdminQueryBoundary';
import { AdminBookingDetailModal } from '../../components/admin/AdminBookingDetailModal';
import { adminBookingActionCopy, getAdminBookingActions } from '../../lib/adminBookingPolicy';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { BookingStatusBadge } from '../../components/mentor/BookingStatusBadge';
import { buildExportFileName, exportWorkbook, type ExportColumn } from '../../lib/adminExport';
import { bookingApi, getBookingStatusLabel, type BookingListParams, type BookingStatus, type MentorBooking, type AdminBookingAction } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { getErrorMessage } from '../../lib/appError';

const bookingExportColumns: ExportColumn[] = [
    { header: 'Mã lịch', key: 'id', width: 14 },
    { header: 'Mentor', key: 'mentor', width: 24 },
    { header: 'Học viên', key: 'student', width: 24 },
    { header: 'Trạng thái', key: 'status', width: 18 },
    { header: 'Loại yêu cầu', key: 'requestType', width: 18 },
    { header: 'Bắt đầu', key: 'startAt', width: 22 },
    { header: 'Kết thúc', key: 'endAt', width: 22 },
    { header: 'Thời lượng', key: 'durationMinute', width: 12 },
    { header: 'Tạo lúc', key: 'createdAt', width: 22 },
    { header: 'Múi giờ', key: 'timezone', width: 26 },
    { header: 'Hạn xác nhận', key: 'responseDueAt', width: 22 },
];

// Gom filter vào 1 chuỗi để export subtitle phản ánh đúng trạng thái list hiện tại.
const formatFilters = (status: 'all' | BookingStatus, search: string, from: string, to: string) => {
    const parts = [status !== 'all' ? `Trạng thái: ${getBookingStatusLabel(status)}` : null,
        search ? `Tìm: ${search}` : null, from ? `Từ: ${from}` : null, to ? `Đến: ${to}` : null].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Không có bộ lọc';
};

const formatDateTime = formatBookingInstant;


export default function AdminBookingsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | BookingStatus>('REQUESTED');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<MentorBooking | null>(null);
    const [actionType, setActionType] = useState<AdminBookingAction | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);
    const submissionInFlight = useRef(false);
    const statusFilterRef = useRef<HTMLSelectElement>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const params = useMemo<BookingListParams>(() => ({
        page,
        limit: 15,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        from: from || undefined,
        to: to || undefined,
    }), [page, search, status, from, to]);

    const bookingsQuery = useQuery({
        queryKey: bookingQueryKeys.adminBookings(params),
        queryFn: () => bookingApi.adminListBookings(params),
        refetchInterval: 60_000,
    });

    const detailQuery = useQuery({
        queryKey: bookingQueryKeys.adminBookingDetail(selectedBooking?.id || ''),
        queryFn: () => bookingApi.adminGetBookingDetail(selectedBooking!.id),
        enabled: Boolean(selectedBooking),
        staleTime: 0,
        refetchInterval: 60_000,
    });

    const invalidateData = async () => {
        await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.adminRoot });
    };

    const bookingMutation = useMutation({
        mutationFn: ({ booking, action, reason }: { booking: MentorBooking; action: AdminBookingAction; reason: string }) => {
            switch (action) {
                case 'confirm': return bookingApi.adminConfirmBooking(booking.id);
                case 'cancel': return bookingApi.adminCancelBooking(booking.id, reason.trim());
                case 'complete': return bookingApi.adminCompleteBooking(booking.id);
                case 'no-show': return bookingApi.adminMarkNoShowBooking(booking.id, reason.trim());
            }
        },
        onSuccess: async (data, vars) => {
            queryClient.setQueryData(bookingQueryKeys.adminBookingDetail(vars.booking.id), { booking: data.booking });
            setSelectedBooking(data.booking);
            setActionSuccess(adminBookingActionCopy[vars.action].success);
            setActionError(null);
            await invalidateData();
            setActionType(null);
            toast.success(adminBookingActionCopy[vars.action].success);
        },
        onError: async (error) => {
            setActionError(getErrorMessage(error, 'Không thể lưu thay đổi lịch tư vấn.'));
            await invalidateData();
        },
        onSettled: () => { submissionInFlight.current = false; },
    });
    const openDetails = (booking: MentorBooking) => {
        if (submissionInFlight.current || bookingMutation.isPending) return;
        setSelectedBooking(booking);
        setActionType(null);
        setActionError(null);
        setActionSuccess(null);
    };
    const closeDetails = () => {
        if (submissionInFlight.current || bookingMutation.isPending || actionType) return;
        setSelectedBooking(null);
        setActionError(null);
        setActionSuccess(null);
    };

    const handleExport = async ({ format, scope, selectedColumnKeys, filePrefix }: { format: 'xlsx' | 'csv'; scope: ExportScope; selectedColumnKeys: string[]; filePrefix: string }) => {
        try {
            setIsExporting(true);
            setExportError(null);
            const columns = bookingExportColumns.filter((column) => selectedColumnKeys.includes(column.key));
            const bookings = scope === 'current'
                ? rows
                : await bookingApi.adminExportBookings({
                    status: params.status,
                    search: params.search,
                    from: params.from,
                    to: params.to,
                }).then((response) => response.bookings);

            await exportWorkbook({
                fileName: buildExportFileName(filePrefix, format),
                title: 'IT Compass — Xuất lịch tư vấn',
                subtitle: formatFilters(status, search, from, to),
                format,
                sheets: [{
                    name: 'Lịch tư vấn',
                    columns,
                    rows: bookings.map((booking) => ({
                        id: booking.id,
                        mentor: booking.mentor.name,
                        student: booking.student.fullName,
                        status: getBookingStatusLabel(booking.status, booking.outcomeReviewRequired, isBookingRequestExpired(booking), booking.cancelledBy),
                        requestType: booking.requestType === 'CUSTOM_TIME' ? 'Giờ đề xuất' : 'Theo lịch mentor',
                        startAt: formatDateTime(booking.startAt),
                        endAt: formatDateTime(booking.endAt),
                        durationMinute: booking.durationMinute,
                        createdAt: formatDateTime(booking.createdAt),
                        timezone: booking.timezone ?? BOOKING_TIMEZONE_LABEL,
                        responseDueAt: booking.responseDueAt ? formatDateTime(booking.responseDueAt) : '',
                    })),
                }],
            });
            setExportOpen(false);
            toast.success('Đã xuất lịch tư vấn.');
        } catch {
            const message = 'Không thể xuất lịch tư vấn.';
            setExportError(message);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    };

    const listReady = bookingsQuery.isSuccess && Array.isArray(bookingsQuery.data?.bookings) && !!bookingsQuery.data?.pagination;
    const rows = listReady ? bookingsQuery.data?.bookings ?? [] : [];
    const pagination = listReady ? bookingsQuery.data?.pagination : undefined;
    const detail = selectedBooking ? detailQuery.data?.booking ?? selectedBooking : null;
    const loading = bookingsQuery.isLoading;
    const detailReliable = detailQuery.isSuccess && !detailQuery.isError && !detailQuery.isFetching;
    const actionAvailable = Boolean(detail && actionType && detailReliable && getAdminBookingActions(detail).includes(actionType));
    const copy = actionType ? adminBookingActionCopy[actionType] : null;
    const detailError = detailQuery.error
        ? getErrorMessage(detailQuery.error, 'Không thể tải chi tiết lịch tư vấn.') : actionError;

    return (
        <>
            <Helmet><title>Quản lý Lịch tư vấn — Admin — IT Compass</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý Lịch tư vấn</h1>
                        <p className="text-sm text-muted-foreground">Theo dõi và xử lý lịch tư vấn. Mặc định hiển thị yêu cầu cần xác nhận.</p>
                    </div>
                    <Button variant="outline" disabled={!listReady} onClick={() => setExportOpen(true)}>
                        <Download className="h-4 w-4" /> Xuất dữ liệu
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-[20px] border bg-background p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:max-w-[240px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input aria-label="Tìm kiếm lịch tư vấn" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm kiếm lịch tư vấn..." className="w-full rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2" />
                        </div>

                        <div className="relative w-full sm:max-w-[200px]">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <select
                                ref={statusFilterRef}
                                aria-label="Trạng thái lịch tư vấn"
                                value={status}
                                onChange={(e) => { setStatus(e.target.value as 'all' | BookingStatus); setPage(1); }}
                                className="w-full appearance-none rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-8 text-sm font-medium outline-none ring-primary/20 focus:ring-2 cursor-pointer text-foreground"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                {(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_MENTOR', 'NO_SHOW'] as const).map(item => (
                                    <option key={item} value={item}>{getBookingStatusLabel(item)}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-2 border-t pt-3 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0">
                        <div className="flex items-center rounded-lg bg-secondary/30 p-1">
                            <div className="flex items-center gap-2 pl-2 pr-1 text-xs text-muted-foreground font-medium">
                                <Calendar size={14} />
                            </div>
                            <input aria-label="Từ ngày" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-md border-none bg-background px-2 py-1.5 text-xs font-medium outline-none ring-primary/20 focus:ring-2 text-foreground" title="Từ ngày" />
                            <span className="px-1 text-muted-foreground text-xs">-</span>
                            <input aria-label="Đến ngày" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-md border-none bg-background px-2 py-1.5 text-xs font-medium outline-none ring-primary/20 focus:ring-2 text-foreground" title="Đến ngày" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Table Area */}
                    <AdminQueryBoundary query={bookingsQuery} label="danh sách lịch tư vấn" hasData={listReady} retryLabel="Tải lại danh sách">
                    <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[400px] flex flex-col">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <Loader />
                            </div>
                        )}
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <caption className="sr-only">Danh sách lịch tư vấn</caption>
                                <thead className="border-b bg-secondary/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th scope="col" className="px-5 py-4">Mã / Loại</th>
                                        <th scope="col" className="px-5 py-4">Mentor</th>
                                        <th scope="col" className="px-5 py-4">Học viên</th>
                                        <th scope="col" className="px-5 py-4">Trạng thái</th>
                                        <th scope="col" className="px-5 py-4">Thời gian</th>
                                        <th scope="col" className="px-5 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length > 0 ? rows.map((booking) => (
                                        <tr key={booking.id} className={`border-b last:border-0 hover:bg-secondary/20 transition-colors ${selectedBooking?.id === booking.id ? 'bg-primary/5' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="font-bold">#{booking.id.slice(-6).toUpperCase()}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{booking.requestType === 'CUSTOM_TIME' ? 'Giờ đề xuất' : 'Theo lịch mentor'}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={booking.mentor.avatarUrl} alt={booking.mentor.name} size="sm" />
                                                    <div>
                                                        <div className="font-medium">{booking.mentor.name}</div>
                                                        <div className="text-[11px] text-muted-foreground">@{booking.mentor.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={booking.student.avatarUrl} alt={booking.student.fullName} size="sm" />
                                                    <div>
                                                        <div className="font-medium max-w-[120px] truncate" title={booking.student.fullName}>{booking.student.fullName}</div>
                                                        <div className="text-[11px] text-muted-foreground max-w-[120px] truncate" title={booking.student.email}>{booking.student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <BookingStatusBadge status={booking.status} outcomeReviewRequired={booking.outcomeReviewRequired} requestExpired={isBookingRequestExpired(booking)} cancelledBy={booking.cancelledBy} />
                                                <BookingRequestDeadline booking={booking} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-sm">{booking.date}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} />
                                                    {booking.startTime} - {booking.endTime} · {BOOKING_TIMEZONE_LABEL}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button variant="secondary" size="sm" disabled={bookingMutation.isPending} onClick={() => openDetails(booking)} className="font-semibold text-xs">
                                                    Chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : bookingsQuery.isError ? (
                                        <tr><td colSpan={6} className="p-5 text-muted-foreground">Danh sách chưa tải được. Hãy thử tải lại.</td></tr>
                                    ) : loading ? (
                                        <tr><td colSpan={6} className="p-5 text-muted-foreground">Đang tải danh sách...</td></tr>
                                    ) : (
                                        <tr>
                                            <td colSpan={6}>
                                                <EmptyState 
                                                    icon={<Calendar size={48} className="opacity-20" />} 
                                                    title="Không tìm thấy lịch hẹn" 
                                                    description="Chưa có dữ liệu hoặc không khớp với bộ lọc." 
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t bg-secondary/10 px-5 py-3 text-sm mt-auto">
                                <div className="text-muted-foreground font-medium">Trang {pagination.page} / {pagination.totalPages}</div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Trang trước</Button>
                                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}>Trang sau</Button>
                                </div>
                            </div>
                        )}
                    </div>
                    </AdminQueryBoundary>
                </div>
            </motion.div>

            {detail && <AdminBookingDetailModal
                booking={detail} isPending={bookingMutation.isPending}
                isLoading={detailQuery.isLoading} isRefreshing={detailQuery.isFetching}
                isReliable={detailReliable} actionOpen={Boolean(actionType)}
                fallbackFocusRef={statusFilterRef}
                errorMessage={detailError} successMessage={actionSuccess}
                onClose={closeDetails} onReload={() => { void detailQuery.refetch(); }}
                onAction={(action) => {
                    if (!detailReliable || submissionInFlight.current || bookingMutation.isPending) return;
                    if (!getAdminBookingActions(detail).includes(action)) {
                        setActionError('Thao tác không còn hợp lệ. Vui lòng tải lại chi tiết.');
                        void detailQuery.refetch();
                        return;
                    }
                    setActionError(null); setActionSuccess(null); setActionType(action);
                }}
            />}

            <AdminExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={handleExport}
                config={{
                    moduleLabel: 'Lịch tư vấn',
                    dataUnavailable: !listReady,
                    isReloading: bookingsQuery.isFetching,
                    onReload: () => { void bookingsQuery.refetch(); },
                    filePrefix: 'bookings-export',
                    totalRows: pagination?.total || 0,
                    filteredRows: pagination?.total || 0,
                    availableColumns: bookingExportColumns,
                    defaultScope: 'range',
                    defaultFormat: 'xlsx',
                    dateRangeLabel: from || to ? `${from || '...'} → ${to || '...'}` : 'Chọn khoảng thời gian trước khi xuất',
                    errorMessage: exportError,
                    isGenerating: isExporting,
                    supportsSelected: false,
                    supportsDateRange: true,
                }}
            />

            <AdminActionDialog
                isOpen={Boolean(actionType && copy)} title={copy?.title ?? ''}
                description={copy?.description} confirmText={copy?.title ?? ''} tone={copy?.tone}
                overlayZIndex={140} isPending={bookingMutation.isPending} isConfirmDisabled={!actionAvailable}
                errorMessage={actionError ?? (!actionAvailable && !bookingMutation.isPending
                    ? 'Lịch đã thay đổi hoặc chi tiết đang được cập nhật. Đóng hộp xác nhận để xem trạng thái mới nhất.' : null)}
                inputType="textarea"
                inputLabel={copy?.requireReason ? actionType === 'no-show' ? 'Căn cứ xác nhận' : 'Lý do hủy' : undefined}
                requireInput={copy?.requireReason} minLength={copy?.requireReason ? 3 : undefined} maxLength={500}
                onClose={() => { if (!bookingMutation.isPending && !submissionInFlight.current) setActionType(null); }}
                onConfirm={(reason) => {
                    if (!detail || !actionType || !actionAvailable || submissionInFlight.current || bookingMutation.isPending) return;
                    if (!getAdminBookingActions(detail).includes(actionType)) {
                        setActionError('Thao tác không còn hợp lệ. Vui lòng tải lại chi tiết.');
                        void detailQuery.refetch();
                        return;
                    }
                    if (copy?.requireReason && (reason.trim().length < 3 || reason.trim().length > 500)) return;
                    submissionInFlight.current = true; setActionError(null);
                    bookingMutation.mutate({ booking: detail, action: actionType, reason });
                }}
            />
        </>
    );
}
