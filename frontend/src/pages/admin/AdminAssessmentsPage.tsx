import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { ClipboardList, Users, TrendingUp, PieChart, Download, Search, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AdminExportModal, type ExportScope } from '../../components/admin/AdminExportModal';
import { assessmentApi, type AdminAssessmentAttempt, type AdminAssessmentAttemptListQuery } from '../../lib/assessmentApi';
import { Loader } from '../../components/ui/Loader';
import { buildExportFileName, collectPagedItems, exportWorkbook, type ExportColumn } from '../../lib/adminExport';
import { toast } from 'sonner';

const attemptsColumns: ExportColumn[] = [
    { header: 'Attempt ID', key: 'id', width: 14 },
    { header: 'User name', key: 'userName', width: 24 },
    { header: 'User email', key: 'userEmail', width: 28 },
    { header: 'Submitted at', key: 'submittedAt', width: 22 },
    { header: 'Duration', key: 'durationText', width: 14 },
    { header: 'Result code', key: 'resultCode', width: 14 },
    { header: 'Top traits', key: 'topTraits', width: 20 },
    { header: 'Recommended majors', key: 'recommendedMajors', width: 28 },
    { header: 'Recommended mentors', key: 'recommendedMentors', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Created at', key: 'createdAt', width: 22 },
    { header: 'Updated at', key: 'updatedAt', width: 22 },
];

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
const durationText = (startedAt?: string | null, submittedAt?: string | null) => {
    if (!startedAt || !submittedAt) return '—';
    const duration = Math.max(0, Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 60000));
    return `${duration} phút`;
};
// Gom filter của assessment thành chuỗi để export/subtitle dùng lại.
const formatFilters = (query: AdminAssessmentAttemptListQuery) => [query.status ? `status=${query.status}` : null, query.resultCode ? `result=${query.resultCode}` : null, query.search ? `search=${query.search}` : null, query.createdFrom ? `from=${query.createdFrom}` : null, query.createdTo ? `to=${query.createdTo}` : null].filter(Boolean).join(' · ') || 'No filters';
const COLORS = ['hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)'];

const resultOptions = ['SE', 'Data', 'Cybersecurity', 'UXUI', 'QLDA', 'DevOps', 'Fallback'];

// Chuẩn hóa attempt sang dạng phẳng để export bảng và hiển thị thống kê.
const mapAttempt = (attempt: AdminAssessmentAttempt) => ({
    id: attempt.id,
    userName: attempt.userName,
    userEmail: attempt.userEmail,
    submittedAt: formatDateTime(attempt.submittedAt),
    durationText: durationText(attempt.startedAt, attempt.submittedAt),
    resultCode: attempt.resultCode,
    topTraits: attempt.topTraits?.join(', ') || '—',
    recommendedMajors: attempt.summary?.suggestedMajors?.join(', ') || '—',
    recommendedMentors: attempt.summary?.suggestedMentorExpertise?.join(', ') || '—',
    status: attempt.status,
    createdAt: formatDateTime(attempt.createdAt),
    updatedAt: formatDateTime(attempt.updatedAt),
});

export default function AdminAssessmentsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [resultCode, setResultCode] = useState('all');
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');
    const [exportOpen, setExportOpen] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const query = useMemo<AdminAssessmentAttemptListQuery>(() => ({
        page,
        limit: 20,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        resultCode: resultCode === 'all' ? undefined : resultCode,
        createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined,
        createdTo: createdTo ? new Date(createdTo).toISOString() : undefined,
    }), [page, search, status, resultCode, createdFrom, createdTo]);

    const attemptsQuery = useQuery({
        queryKey: ['adminAssessments', query],
        queryFn: () => assessmentApi.getAdminAttempts(query),
    });

    const statsQuery = useQuery({
        queryKey: ['adminAssessmentsStats'],
        queryFn: assessmentApi.getAdminStats,
    });

    const stats = statsQuery.data?.stats;
    const attempts = attemptsQuery.data?.attempts ?? [];
    const pagination = attemptsQuery.data?.pagination;
    const distributionData = stats?.resultDistribution?.map((item) => ({ name: item.resultCode, total: item.total })) || [];
    const trendData = stats?.trend || [];

    // Xuất report assessment theo range đang lọc.
    const handleExport = async ({ format, scope, selectedColumnKeys, filePrefix }: { format: 'xlsx' | 'csv'; scope: ExportScope; selectedColumnKeys: string[]; filePrefix: string }) => {
        try {
            setExportError(null);
            const columns = attemptsColumns.filter((column) => selectedColumnKeys.includes(column.key));
            const firstPage = await assessmentApi.getAdminExportAttempts({ ...query, page: 1, limit: 100 });
            const exportRows = scope === 'all'
                ? await collectPagedItems({
                    initialPage: firstPage,
                    fetchPage: (nextPage, nextLimit) => assessmentApi.getAdminExportAttempts({ ...query, page: nextPage, limit: nextLimit }),
                    selectItems: (response) => response.attempts,
                    selectPagination: (response) => response.pagination,
                })
                : firstPage.attempts;

            await exportWorkbook({
                fileName: buildExportFileName(filePrefix, format),
                title: 'IT Compass — Export Assessments',
                subtitle: formatFilters(query),
                format,
                sheets: [
                    {
                        name: 'Summary',
                        columns: [
                            { header: 'Chỉ số', key: 'label', width: 28 },
                            { header: 'Giá trị', key: 'value', width: 18 },
                        ],
                        rows: [
                            { label: 'Tổng lượt làm', value: stats?.totalAttempts ?? 0 },
                            { label: 'Học viên hoàn thành', value: stats?.completedUsers ?? 0 },
                            { label: 'Tỷ lệ hoàn thành', value: `${stats?.completionRate ?? 0}%` },
                        ],
                    },
                    {
                        name: 'Attempts',
                        columns,
                        rows: exportRows.map(mapAttempt),
                    },
                ],
            });
            toast.success('Đã xuất file assessment.');
            setExportOpen(false);
        } catch {
            const message = 'Không thể xuất dữ liệu assessment.';
            setExportError(message);
            toast.error(message);
        }
    };

    if (attemptsQuery.isLoading || statsQuery.isLoading) {
        return <div className="flex h-[400px] items-center justify-center"><Loader /></div>;
    }

    return (
        <>
            <Helmet><title>Quản lý Assessment — Admin — IT Compass</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Quản lý Assessment</h1>
                        <p className="text-sm text-muted-foreground">Attempt list, filter, export theo range, trend dashboard.</p>
                    </div>
                    <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15">
                        <Download className="h-4 w-4" /> Export
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tổng lượt làm</p><ClipboardList className="w-4 h-4 text-primary" /></div><h3 className="mt-2 text-3xl font-black text-primary">{stats?.totalAttempts?.toLocaleString() || 0}</h3></div>
                    <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Học viên hoàn thành</p><Users className="w-4 h-4 text-emerald-500" /></div><h3 className="mt-2 text-3xl font-black text-emerald-500">{stats?.completedUsers?.toLocaleString() || 0}</h3></div>
                    <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tỷ lệ hoàn thành</p><TrendingUp className="w-4 h-4 text-amber-500" /></div><h3 className="mt-2 text-3xl font-black text-amber-500">{stats?.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}</h3></div>
                    <div className="rounded-2xl border bg-background p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loại kết quả</p><PieChart className="w-4 h-4 text-indigo-500" /></div><h3 className="mt-2 text-3xl font-black text-indigo-500">{distributionData.length}</h3></div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border bg-background p-6 shadow-sm lg:col-span-2">
                        <h3 className="mb-4 text-lg font-bold">Phân bố thiên hướng nghề nghiệp</h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>{distributionData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="rounded-2xl border bg-background p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-bold">Trend 6 tháng</h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="rounded-[20px] border bg-background p-3 shadow-sm lg:flex lg:items-center lg:justify-between">
                    <div className="grid gap-3 p-1 md:grid-cols-5 lg:flex-1">
                        <div className="relative w-full">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input className="w-full rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search user/email..." />
                        </div>
                        <div className="relative w-full">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <select className="w-full appearance-none rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-8 text-sm outline-none ring-primary/20 focus:ring-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                                <option value="all">Tất cả trạng thái</option>
                                <option value="SUBMITTED">SUBMITTED</option>
                                <option value="DRAFT">DRAFT</option>
                            </select>
                        </div>
                        <div className="relative w-full">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <select className="w-full appearance-none rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-8 text-sm outline-none ring-primary/20 focus:ring-2" value={resultCode} onChange={(e) => { setResultCode(e.target.value); setPage(1); }}>
                                <option value="all">Tất cả kết quả</option>
                                {resultOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                        <div className="relative w-full">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input type="datetime-local" className="w-full rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2" value={createdFrom} onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }} />
                        </div>
                        <div className="relative w-full">
                            <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input type="datetime-local" className="w-full rounded-lg border-none bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none ring-primary/20 focus:ring-2" value={createdTo} onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }} />
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[400px]">
                    <div className="border-b px-5 py-3 text-xs text-muted-foreground">{formatFilters(query)}</div>
                    {attemptsQuery.isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"><Loader /></div>}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                                <tr>
                                    <th className="px-5 py-4">User</th>
                                    <th className="px-5 py-4">Result</th>
                                    <th className="px-5 py-4">Submitted</th>
                                    <th className="px-5 py-4">Duration</th>
                                    <th className="px-5 py-4">Traits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map((attempt) => (
                                    <tr key={attempt.id} className="border-b last:border-0 hover:bg-secondary/10 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-medium">{attempt.userName}</div>
                                            <div className="text-xs text-muted-foreground">{attempt.userEmail}</div>
                                        </td>
                                        <td className="px-5 py-4 font-mono text-xs">{attempt.resultCode}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{formatDateTime(attempt.submittedAt)}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{durationText(attempt.startedAt, attempt.submittedAt)}</td>
                                        <td className="px-5 py-4 text-muted-foreground max-w-[320px] truncate">{attempt.topTraits.join(', ') || '—'}</td>
                                    </tr>
                                ))}
                                {attempts.length === 0 && !attemptsQuery.isLoading && (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Không có assessment nào khớp bộ lọc.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="border-t p-4 flex items-center justify-between bg-muted/10">
                            <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm">Trang trước</button>
                            <div className="flex items-center gap-2 font-bold text-sm"><span className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-lg">{pagination.page}</span><span className="text-muted-foreground">/ {pagination.totalPages}</span></div>
                            <button disabled={page >= pagination.totalPages} onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm">Trang sau</button>
                        </div>
                    )}
                </div>

                <AdminExportModal
                    isOpen={exportOpen}
                    onClose={() => setExportOpen(false)}
                    onExport={handleExport}
                    config={{
                        moduleLabel: 'Assessments',
                        filePrefix: 'assessments-export',
                        totalRows: pagination?.total || 0,
                        filteredRows: pagination?.total || 0,
                        availableColumns: attemptsColumns,
                        defaultScope: 'range',
                        defaultFormat: 'xlsx',
                        errorMessage: exportError,
                        supportsDateRange: true,
                        dateRangeLabel: createdFrom || createdTo ? `${createdFrom || '...'} → ${createdTo || '...'}` : 'Chọn khoảng thời gian trước khi xuất',
                    }}
                />
            </motion.div>
        </>
    );
}
