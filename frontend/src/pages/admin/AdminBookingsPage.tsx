import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Search, CheckCircle2, XCircle, CircleDashed, Clock, Calendar, User, AlignLeft, Info, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { AdminExportModal, type ExportScope } from '../../components/admin/AdminExportModal';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { buildExportFileName, exportWorkbook, type ExportColumn } from '../../lib/adminExport';
import { bookingApi, type BookingListParams, type BookingStatus, type MentorBooking } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { getErrorMessage } from '../../lib/appError';

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    REQUESTED: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED_BY_STUDENT: 'Học viên hủy',
    CANCELLED_BY_MENTOR: 'Mentor hủy',
    COMPLETED: 'Hoàn thành',
    NO_SHOW: 'No-show',
};

const BOOKING_STATUS_VARIANT: Record<BookingStatus, 'default' | 'secondary' | 'accent' | 'destructive' | 'success'> = {
    REQUESTED: 'accent',
    CONFIRMED: 'default',
    CANCELLED_BY_STUDENT: 'destructive',
    CANCELLED_BY_MENTOR: 'destructive',
    COMPLETED: 'success',
    NO_SHOW: 'secondary',
};

const bookingExportColumns: ExportColumn[] = [
    { header: 'Booking ID', key: 'id', width: 14 },
    { header: 'Mentor', key: 'mentor', width: 24 },
    { header: 'Student', key: 'student', width: 24 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Request type', key: 'requestType', width: 18 },
    { header: 'Start', key: 'startAt', width: 22 },
    { header: 'End', key: 'endAt', width: 22 },
    { header: 'Duration', key: 'durationMinute', width: 12 },
    { header: 'Created at', key: 'createdAt', width: 22 },
];

// Gom filter vào 1 chuỗi để export subtitle phản ánh đúng trạng thái list hiện tại.
const formatFilters = (status: 'all' | BookingStatus, search: string, from: string, to: string) => {
    const parts = [status !== 'all' ? `status=${status}` : null, search ? `search=${search}` : null, from ? `from=${from}` : null, to ? `to=${to}` : null].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'No filters';
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('vi-VN');


export default function AdminBookingsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'all' | BookingStatus>('all');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<MentorBooking | null>(null);
    const [actionType, setActionType] = useState<'confirm' | 'cancel' | 'complete' | 'no-show' | null>(null);
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
    });

    const detailQuery = useQuery({
        queryKey: bookingQueryKeys.adminBookingDetail(selectedBooking?.id || ''),
        queryFn: () => bookingApi.adminGetBookingDetail(selectedBooking!.id),
        enabled: Boolean(selectedBooking),
        staleTime: 0,
    });

    const invalidateData = async (bookingId?: string) => {
        await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.adminRoot });
        if (bookingId) {
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.adminBookingDetail(bookingId) });
        }
    };

    const confirmMutation = useMutation({
        mutationFn: (booking: MentorBooking) => bookingApi.adminConfirmBooking(booking.id),
        onSuccess: async (_data, booking) => {
            await invalidateData(booking.id);
            toast.success('Đã xác nhận booking.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể xác nhận booking.')),
    });

    const cancelMutation = useMutation({
        mutationFn: ({ booking, reason }: { booking: MentorBooking; reason: string }) => bookingApi.adminCancelBooking(booking.id, reason),
        onSuccess: async (_data, vars) => {
            await invalidateData(vars.booking.id);
            setActionType(null);
            toast.success('Đã hủy booking.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể hủy booking.')),
    });

    const completeMutation = useMutation({
        mutationFn: (booking: MentorBooking) => bookingApi.adminCompleteBooking(booking.id),
        onSuccess: async (_data, booking) => {
            await invalidateData(booking.id);
            toast.success('Đã hoàn thành booking.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể hoàn thành booking.')),
    });

    const noShowMutation = useMutation({
        mutationFn: (booking: MentorBooking) => bookingApi.adminMarkNoShowBooking(booking.id),
        onSuccess: async (_data, booking) => {
            await invalidateData(booking.id);
            toast.success('Đã đánh dấu no-show.');
        },
        onError: (error) => toast.error(getErrorMessage(error, 'Không thể cập nhật no-show.')),
    });

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
                title: 'IT Compass — Export Bookings',
                subtitle: formatFilters(status, search, from, to),
                format,
                sheets: [{
                    name: 'Bookings',
                    columns,
                    rows: bookings.map((booking) => ({
                        id: booking.id,
                        mentor: booking.mentor.name,
                        student: booking.student.fullName,
                        status: BOOKING_STATUS_LABEL[booking.status],
                        requestType: booking.requestType,
                        startAt: formatDateTime(booking.startAt),
                        endAt: formatDateTime(booking.endAt),
                        durationMinute: booking.durationMinute,
                        createdAt: formatDateTime(booking.createdAt),
                    })),
                }],
            });
            setExportOpen(false);
            toast.success('Đã xuất booking.');
        } catch {
            const message = 'Không thể xuất booking.';
            setExportError(message);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    };

    const rows = bookingsQuery.data?.bookings ?? [];
    const pagination = bookingsQuery.data?.pagination;
    const detail = detailQuery.data?.booking ?? selectedBooking;
    const loading = bookingsQuery.isLoading || detailQuery.isLoading;

    return (
        <>
            <Helmet><title>Quản lý Lịch tư vấn — Admin — IT Compass</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý Lịch tư vấn</h1>
                        <p className="text-sm text-muted-foreground">Theo dõi, triage và can thiệp luồng tư vấn giữa mentor và student.</p>
                    </div>
                    <Button variant="outline" onClick={() => setExportOpen(true)}>
                        <Download className="h-4 w-4" /> Export
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-[20px] border bg-background p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:max-w-[240px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm kiếm booking..." className="w-full rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2" />
                        </div>

                        <div className="relative w-full sm:max-w-[200px]">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value as 'all' | BookingStatus); setPage(1); }}
                                className="w-full appearance-none rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-8 text-sm font-medium outline-none ring-primary/20 focus:ring-2 cursor-pointer text-foreground"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                {(['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_MENTOR', 'NO_SHOW'] as const).map(item => (
                                    <option key={item} value={item}>{BOOKING_STATUS_LABEL[item]}</option>
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
                            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-md border-none bg-background px-2 py-1.5 text-xs font-medium outline-none ring-primary/20 focus:ring-2 text-foreground" title="Từ ngày" />
                            <span className="px-1 text-muted-foreground text-xs">-</span>
                            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-md border-none bg-background px-2 py-1.5 text-xs font-medium outline-none ring-primary/20 focus:ring-2 text-foreground" title="Đến ngày" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Table Area */}
                    <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[400px] flex flex-col">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <Loader />
                            </div>
                        )}
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="border-b bg-secondary/30 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-4">Mã / Loại</th>
                                        <th className="px-5 py-4">Mentor</th>
                                        <th className="px-5 py-4">Học viên</th>
                                        <th className="px-5 py-4">Trạng thái</th>
                                        <th className="px-5 py-4">Thời gian</th>
                                        <th className="px-5 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length > 0 ? rows.map((booking) => (
                                        <tr key={booking.id} className={`border-b last:border-0 hover:bg-secondary/20 transition-colors ${selectedBooking?.id === booking.id ? 'bg-primary/5' : ''}`}>
                                            <td className="px-5 py-4">
                                                <div className="font-bold">#{booking.id.slice(-6).toUpperCase()}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">{booking.requestType}</div>
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
                                                <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>{BOOKING_STATUS_LABEL[booking.status]}</Badge>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-sm">{booking.date}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} />
                                                    {booking.startTime} - {booking.endTime}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button variant="secondary" size="sm" onClick={() => setSelectedBooking(booking)} className="font-semibold text-xs">
                                                    Chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : (
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
                                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Prev</Button>
                                    <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}>Next</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {createPortal(
                <AnimatePresence>
                    {detail && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[130] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setSelectedBooking(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-[24px] border bg-background shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                    <X size={16} />
                                </button>
                                
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div className="p-6 border-b flex-shrink-0 pr-12">
                                        <div className="flex items-center gap-4 mb-2">
                                            <h2 className="text-xl font-bold tracking-tight">Chi tiết Booking</h2>
                                            <Badge variant={BOOKING_STATUS_VARIANT[detail.status]} className="text-[11px]">{BOOKING_STATUS_LABEL[detail.status]}</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground font-mono bg-secondary/50 p-2 rounded-lg break-all inline-block">ID: {detail.id}</div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        <div className="grid gap-4">
                                            <div className="flex gap-4 items-start p-4 rounded-xl border bg-secondary/20">
                                                <div className="mt-0.5 text-primary"><Calendar size={18} /></div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground font-medium mb-1">Thời gian tư vấn</div>
                                                    <div className="font-semibold text-base">{detail.date}</div>
                                                    <div className="text-sm flex items-center gap-2 mt-1">
                                                        <Clock size={14} className="text-muted-foreground" />
                                                        {detail.startTime} - {detail.endTime} ({detail.durationMinute} phút)
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="flex-1 p-4 rounded-xl border">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><User size={14}/> Mentor</div>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={detail.mentor.avatarUrl} alt={detail.mentor.name} size="md" />
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-sm truncate">{detail.mentor.name}</div>
                                                            <div className="text-xs text-muted-foreground truncate">@{detail.mentor.slug}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-4 rounded-xl border">
                                                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><User size={14}/> Học viên</div>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={detail.student.avatarUrl} alt={detail.student.fullName} size="md" />
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-sm truncate" title={detail.student.fullName}>{detail.student.fullName}</div>
                                                            <div className="text-xs text-muted-foreground truncate" title={detail.student.email}>{detail.student.email}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold flex items-center gap-2"><Info size={14} className="text-muted-foreground" /> Tạo lúc</div>
                                                    <div className="text-sm text-muted-foreground pl-6">{formatDateTime(detail.createdAt)}</div>
                                                </div>
                                                {detail.note && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-semibold flex items-center gap-2"><AlignLeft size={14} className="text-muted-foreground" /> Ghi chú từ học viên</div>
                                                        <div className="text-sm bg-secondary/30 p-3 rounded-lg leading-relaxed text-muted-foreground ml-6 border">{detail.note}</div>
                                                    </div>
                                                )}
                                                {detail.cancelReason && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-semibold text-destructive flex items-center gap-2"><XCircle size={14} /> Lý do hủy</div>
                                                        <div className="text-sm bg-destructive/5 p-3 rounded-lg leading-relaxed text-destructive ml-6 border border-destructive/20">{detail.cancelReason}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 border-t flex-shrink-0 bg-secondary/10">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Thao tác can thiệp</div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent w-full" disabled={confirmMutation.isPending} onClick={() => { confirmMutation.mutate(detail); setSelectedBooking(null); }}>
                                                <CheckCircle2 size={16} /> Xác nhận
                                            </Button>
                                            <Button variant="default" className="w-full" disabled={completeMutation.isPending} onClick={() => { completeMutation.mutate(detail); setSelectedBooking(null); }}>
                                                <CheckCircle2 size={16} /> Hoàn thành
                                            </Button>
                                            <Button variant="secondary" className="bg-slate-700 hover:bg-slate-800 text-white w-full" disabled={noShowMutation.isPending} onClick={() => { noShowMutation.mutate(detail); setSelectedBooking(null); }}>
                                                <CircleDashed size={16} /> No-show
                                            </Button>
                                            <Button variant="destructive" className="w-full" onClick={() => setActionType('cancel')}>
                                                <XCircle size={16} /> Hủy lịch
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <AdminExportModal
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                onExport={handleExport}
                config={{
                    moduleLabel: 'Bookings',
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
                isOpen={actionType === 'cancel'}
                title="Hủy booking"
                description="Nhập lý do hủy để tiếp tục."
                confirmText="Hủy booking"
                tone="destructive"
                inputType="textarea"
                inputLabel="Lý do"
                requireInput
                minLength={3}
                onClose={() => setActionType(null)}
                onConfirm={(reason) => {
                    if (!selectedBooking) return;
                    cancelMutation.mutate({ booking: selectedBooking, reason });
                }}
            />
        </>
    );
}
