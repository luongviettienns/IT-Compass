import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { adminUserApi, type AdminAuditLog, type AuditAction } from '../../lib/adminUserApi';
import { blogApi, type AdminBlogAuditAction, type AdminBlogAuditLog } from '../../lib/blogApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { AdminExportModal, type ExportScope } from '../../components/admin/AdminExportModal';
import { buildExportFileName, collectPagedItems, exportWorkbook, type ExportColumn } from '../../lib/adminExport';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

const auditUserColumns: ExportColumn[] = [
    { header: 'Time', key: 'createdAt', width: 22 },
    { header: 'Action', key: 'action', width: 18 },
    { header: 'Actor', key: 'actor', width: 24 },
    { header: 'Target', key: 'target', width: 24 },
    { header: 'Reason', key: 'reason', width: 36 },
];

const auditBlogColumns: ExportColumn[] = [
    { header: 'Time', key: 'createdAt', width: 22 },
    { header: 'Action', key: 'action', width: 18 },
    { header: 'Actor', key: 'actor', width: 24 },
    { header: 'Target type', key: 'targetType', width: 18 },
    { header: 'Target ID', key: 'targetId', width: 18 },
    { header: 'Reason', key: 'reason', width: 36 },
];

// Gom filter audit log để subtitle export phản ánh đúng query hiện tại.
const formatAuditFilters = (tab: AuditTab, userQuery: Record<string, unknown>, blogQuery: Record<string, unknown>) => tab === 'users'
    ? [userQuery.actorUserId ? `actor=${userQuery.actorUserId}` : null, userQuery.targetUserId ? `target=${userQuery.targetUserId}` : null, userQuery.action !== 'all' ? `action=${userQuery.action}` : null, userQuery.createdFrom ? `from=${userQuery.createdFrom}` : null, userQuery.createdTo ? `to=${userQuery.createdTo}` : null].filter(Boolean).join(' · ') || 'No filters'
    : [blogQuery.actorUserId ? `actor=${blogQuery.actorUserId}` : null, blogQuery.action !== 'all' ? `action=${blogQuery.action}` : null, blogQuery.targetType !== 'all' ? `targetType=${blogQuery.targetType}` : null, blogQuery.targetId ? `targetId=${blogQuery.targetId}` : null, blogQuery.createdFrom ? `from=${blogQuery.createdFrom}` : null, blogQuery.createdTo ? `to=${blogQuery.createdTo}` : null].filter(Boolean).join(' · ') || 'No filters';
// Đổi record audit log sang dạng phẳng để export được sạch và đồng nhất.
const auditExportRows = (log: AdminAuditLog | AdminBlogAuditLog, tab: AuditTab) => tab === 'users'
    ? ({
        createdAt: new Date((log as AdminAuditLog).createdAt).toLocaleString('vi-VN'),
        action: (log as AdminAuditLog).action,
        actor: (log as AdminAuditLog).actorUser?.fullName || 'Hệ thống',
        target: (log as AdminAuditLog).targetUser?.fullName || 'N/A',
        reason: (log as AdminAuditLog).reason || '-',
      })
    : ({
        createdAt: new Date((log as AdminBlogAuditLog).createdAt).toLocaleString('vi-VN'),
        action: (log as AdminBlogAuditLog).action,
        actor: (log as AdminBlogAuditLog).actorUser?.fullName || 'N/A',
        targetType: (log as AdminBlogAuditLog).targetType,
        targetId: (log as AdminBlogAuditLog).targetId || '—',
        reason: (log as AdminBlogAuditLog).reason || '-',
      });
// Tiêu đề export theo tab audit đang mở.
const auditTitle = (tab: AuditTab) => (tab === 'users' ? 'IT Compass — Export User Audit Logs' : 'IT Compass — Export Blog Audit Logs');
// Tên sheet export theo loại audit log.
const auditSheetName = (tab: AuditTab) => (tab === 'users' ? 'User Audit' : 'Blog Audit');
// Chọn bộ cột export tương ứng với tab hiện tại.
const auditColumns = (tab: AuditTab) => (tab === 'users' ? auditUserColumns : auditBlogColumns);

type AuditTab = 'users' | 'blogs';
type BlogTargetType = 'all' | 'BLOG_POST' | 'BLOG_COMMENT';

const userActionOptions: Array<{ value: 'all' | AuditAction; label: string }> = [
    { value: 'all', label: 'Tất cả hành động' },
    { value: 'UPDATE_ACCOUNT', label: 'Cập nhật tài khoản' },
    { value: 'UPDATE_PROFILE', label: 'Cập nhật hồ sơ' },
    { value: 'UPDATE_STATUS', label: 'Đổi trạng thái' },
    { value: 'UPDATE_ROLE', label: 'Đổi vai trò' },
    { value: 'REVOKE_SESSIONS', label: 'Thu hồi phiên' },
    { value: 'BULK_UPDATE_STATUS', label: 'Đổi trạng thái hàng loạt' },
    { value: 'BULK_REVOKE_SESSIONS', label: 'Thu hồi phiên hàng loạt' },
];

const blogActionOptions: Array<{ value: 'all' | AdminBlogAuditAction; label: string }> = [
    { value: 'all', label: 'Tất cả hành động' },
    { value: 'CREATE_POST', label: 'Tạo bài viết' },
    { value: 'UPDATE_POST', label: 'Cập nhật bài viết' },
    { value: 'UPDATE_POST_STATUS', label: 'Đổi trạng thái bài viết' },
    { value: 'PUBLISH_POST', label: 'Xuất bản bài viết' },
    { value: 'SCHEDULE_POST', label: 'Lên lịch bài viết' },
    { value: 'DELETE_POST', label: 'Xóa bài viết' },
    { value: 'RESTORE_POST', label: 'Khôi phục bài viết' },
    { value: 'MODERATE_COMMENT', label: 'Kiểm duyệt bình luận' },
    { value: 'DELETE_COMMENT', label: 'Xóa bình luận' },
];

const actionBadgeMap: Record<string, string> = {
    UPDATE_ACCOUNT: 'bg-blue-500/10 text-blue-500',
    UPDATE_PROFILE: 'bg-sky-500/10 text-sky-500',
    UPDATE_STATUS: 'bg-amber-500/10 text-amber-500',
    UPDATE_ROLE: 'bg-purple-500/10 text-purple-500',
    REVOKE_SESSIONS: 'bg-destructive/10 text-destructive',
    BULK_UPDATE_STATUS: 'bg-orange-500/10 text-orange-500',
    BULK_REVOKE_SESSIONS: 'bg-rose-500/10 text-rose-500',
    CREATE_POST: 'bg-emerald-500/10 text-emerald-500',
    UPDATE_POST: 'bg-blue-500/10 text-blue-500',
    UPDATE_POST_STATUS: 'bg-indigo-500/10 text-indigo-500',
    PUBLISH_POST: 'bg-primary/10 text-primary',
    SCHEDULE_POST: 'bg-cyan-500/10 text-cyan-500',
    DELETE_POST: 'bg-destructive/10 text-destructive',
    RESTORE_POST: 'bg-lime-500/10 text-lime-500',
    MODERATE_COMMENT: 'bg-fuchsia-500/10 text-fuchsia-500',
    DELETE_COMMENT: 'bg-red-500/10 text-red-500',
};

const inputClass = 'bg-secondary/50 rounded-xl py-2 px-4 text-sm outline-none ring-primary/20 focus:ring-2 border-none';

function ActionBadge({ action }: { action: string }) {
    return (
        <span className={`font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded inline-block ${actionBadgeMap[action] || 'bg-secondary text-foreground'}`}>
            {action}
        </span>
    );
}

export default function AdminAuditLogsPage() {
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<AuditTab>('users');
    const [actorUserId, setActorUserId] = useState('');
    const [targetUserId, setTargetUserId] = useState('');
    const [userAction, setUserAction] = useState<'all' | AuditAction>('all');
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');
    const [blogAction, setBlogAction] = useState<'all' | AdminBlogAuditAction>('all');
    const [blogTargetType, setBlogTargetType] = useState<BlogTargetType>('all');
    const [blogTargetId, setBlogTargetId] = useState('');
    const [exportOpen, setExportOpen] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedUserLog, setSelectedUserLog] = useState<AdminAuditLog | null>(null);
    const [selectedBlogLog, setSelectedBlogLog] = useState<AdminBlogAuditLog | null>(null);

    const userAuditQuery = useMemo(
        () => ({
            page,
            limit: 15,
            actorUserId,
            targetUserId,
            action: userAction,
            createdFrom,
            createdTo,
        }),
        [page, actorUserId, targetUserId, userAction, createdFrom, createdTo],
    );

    const blogAuditQuery = useMemo(
        () => ({
            page,
            limit: 15,
            actorUserId,
            action: blogAction,
            targetType: blogTargetType,
            targetId: blogTargetId,
        }),
        [page, actorUserId, blogAction, blogTargetType, blogTargetId],
    );

    const usersAudit = useQuery({
        queryKey: adminQueryKeys.auditLogs(userAuditQuery),
        queryFn: () =>
            adminUserApi.listAuditLogs({
                page,
                limit: 15,
                actorUserId: actorUserId || undefined,
                targetUserId: targetUserId || undefined,
                action: userAction === 'all' ? undefined : userAction,
                createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined,
                createdTo: createdTo ? new Date(createdTo).toISOString() : undefined,
            }),
        enabled: activeTab === 'users',
    });

    const blogsAudit = useQuery({
        queryKey: adminQueryKeys.blogAuditLogs(blogAuditQuery),
        queryFn: () =>
            blogApi.adminListAuditLogs({
                page,
                limit: 15,
                actorUserId: actorUserId || undefined,
                action: blogAction === 'all' ? undefined : blogAction,
                targetType: blogTargetType === 'all' ? undefined : blogTargetType,
                targetId: blogTargetId || undefined,
            }),
        enabled: activeTab === 'blogs',
    });

    const isLoading = activeTab === 'users' ? usersAudit.isLoading : blogsAudit.isLoading;
    const data = activeTab === 'users' ? usersAudit.data : blogsAudit.data;

    const handleExport = async ({ format, scope, selectedColumnKeys, filePrefix }: { format: 'xlsx' | 'csv'; scope: ExportScope; selectedColumnKeys: string[]; filePrefix: string }) => {
        try {
            setIsExporting(true);
            setExportError(null);
            const isUserTab = activeTab === 'users';
            void scope;
            const columns = auditColumns(activeTab).filter((column) => selectedColumnKeys.includes(column.key));

            if (isUserTab) {
                const firstPage = await adminUserApi.listAuditLogs({ page: 1, limit: 100, actorUserId: actorUserId || undefined, targetUserId: targetUserId || undefined, action: userAction === 'all' ? undefined : userAction, createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined, createdTo: createdTo ? new Date(createdTo).toISOString() : undefined });
                const exportRows = await collectPagedItems<Awaited<ReturnType<typeof adminUserApi.listAuditLogs>>, AdminAuditLog>({
                    initialPage: firstPage,
                    fetchPage: (currentPage, limit) => adminUserApi.listAuditLogs({ page: currentPage, limit, actorUserId: actorUserId || undefined, targetUserId: targetUserId || undefined, action: userAction === 'all' ? undefined : userAction, createdFrom: createdFrom ? new Date(createdFrom).toISOString() : undefined, createdTo: createdTo ? new Date(createdTo).toISOString() : undefined }),
                    selectItems: (response) => response.logs,
                    selectPagination: (response) => response.pagination,
                });

                await exportWorkbook({
                    fileName: buildExportFileName(filePrefix, format),
                    title: auditTitle(activeTab),
                    subtitle: formatAuditFilters(activeTab, userAuditQuery, blogAuditQuery),
                    format,
                    sheets: [{
                        name: auditSheetName(activeTab),
                        columns,
                        rows: exportRows.map((log) => auditExportRows(log, activeTab)),
                    }],
                });
            } else {
                const firstPage = await blogApi.adminListAuditLogs({ page: 1, limit: 100, actorUserId: actorUserId || undefined, action: blogAction === 'all' ? undefined : blogAction, targetType: blogTargetType === 'all' ? undefined : blogTargetType, targetId: blogTargetId || undefined });
                const exportRows = await collectPagedItems<Awaited<ReturnType<typeof blogApi.adminListAuditLogs>>, AdminBlogAuditLog>({
                    initialPage: firstPage,
                    fetchPage: (currentPage, limit) => blogApi.adminListAuditLogs({ page: currentPage, limit, actorUserId: actorUserId || undefined, action: blogAction === 'all' ? undefined : blogAction, targetType: blogTargetType === 'all' ? undefined : blogTargetType, targetId: blogTargetId || undefined }),
                    selectItems: (response) => response.logs,
                    selectPagination: (response) => response.pagination,
                });

                await exportWorkbook({
                    fileName: buildExportFileName(filePrefix, format),
                    title: auditTitle(activeTab),
                    subtitle: formatAuditFilters(activeTab, userAuditQuery, blogAuditQuery),
                    format,
                    sheets: [{
                        name: auditSheetName(activeTab),
                        columns,
                        rows: exportRows.map((log) => auditExportRows(log, activeTab)),
                    }],
                });
            }

            setExportOpen(false);
            toast.success('Đã xuất audit log.');
        } catch {
            const message = 'Không thể xuất audit log.';
            setExportError(message);
            toast.error(message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleTabChange = (tab: AuditTab) => {
        setActiveTab(tab);
        setPage(1);
    };

    const resetUserFilters = () => {
        setActorUserId('');
        setTargetUserId('');
        setUserAction('all');
        setCreatedFrom('');
        setCreatedTo('');
        setPage(1);
    };

    const resetBlogFilters = () => {
        setActorUserId('');
        setBlogAction('all');
        setBlogTargetType('all');
        setBlogTargetId('');
        setPage(1);
    };

    return (
        <>
            <Helmet><title>Nhật ký Hệ thống — Admin — IT Compass</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Nhật ký Hệ thống</h1>
                        <p className="text-sm text-muted-foreground">
                            Theo dõi thao tác quản trị cho người dùng và blog theo đúng dữ liệu backend đang cung cấp.
                        </p>
                    </div>
                    <button onClick={() => setExportOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/15">
                        <Download className="h-4 w-4" /> Export
                    </button>
                </div>

                <AdminExportModal
                    isOpen={exportOpen}
                    onClose={() => setExportOpen(false)}
                    onExport={handleExport}
                    config={{
                        moduleLabel: activeTab === 'users' ? 'User Audit Logs' : 'Blog Audit Logs',
                        filePrefix: activeTab === 'users' ? 'audit-users-export' : 'audit-blogs-export',
                        totalRows: data?.pagination?.total || 0,
                        filteredRows: data?.pagination?.total || 0,
                        availableColumns: activeTab === 'users' ? auditUserColumns : auditBlogColumns,
                        defaultScope: 'current',
                        defaultFormat: 'xlsx',
                        errorMessage: exportError,
                        isGenerating: isExporting,
                    }}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => handleTabChange('users')}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'users' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                    >
                        Audit người dùng
                    </button>
                    <button
                        onClick={() => handleTabChange('blogs')}
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'blogs' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
                    >
                        Audit blog
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <div className="grid gap-3 rounded-[24px] border bg-background p-4 md:grid-cols-5">
                        <input
                            type="text"
                            placeholder="Actor user ID"
                            className={inputClass}
                            value={actorUserId}
                            onChange={(e) => { setActorUserId(e.target.value); setPage(1); }}
                        />
                        <input
                            type="text"
                            placeholder="Target user ID"
                            className={inputClass}
                            value={targetUserId}
                            onChange={(e) => { setTargetUserId(e.target.value); setPage(1); }}
                        />
                        <select
                            className={inputClass}
                            value={userAction}
                            onChange={(e) => { setUserAction(e.target.value as 'all' | AuditAction); setPage(1); }}
                        >
                            {userActionOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <input
                            type="datetime-local"
                            className={inputClass}
                            value={createdFrom}
                            onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
                        />
                        <div className="flex items-center gap-3">
                            <input
                                type="datetime-local"
                                className={`${inputClass} w-full`}
                                value={createdTo}
                                onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
                            />
                            <button onClick={resetUserFilters} className="shrink-0 rounded-xl bg-secondary px-4 py-2 text-sm font-bold hover:bg-secondary/70 transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 rounded-[24px] border bg-background p-4 md:grid-cols-4">
                        <input
                            type="text"
                            placeholder="Actor user ID"
                            className={inputClass}
                            value={actorUserId}
                            onChange={(e) => { setActorUserId(e.target.value); setPage(1); }}
                        />
                        <select
                            className={inputClass}
                            value={blogAction}
                            onChange={(e) => { setBlogAction(e.target.value as 'all' | AdminBlogAuditAction); setPage(1); }}
                        >
                            {blogActionOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <select
                            className={inputClass}
                            value={blogTargetType}
                            onChange={(e) => { setBlogTargetType(e.target.value as BlogTargetType); setPage(1); }}
                        >
                            <option value="all">Tất cả đối tượng</option>
                            <option value="BLOG_POST">Bài viết</option>
                            <option value="BLOG_COMMENT">Bình luận</option>
                        </select>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                placeholder="Target ID"
                                className={`${inputClass} w-full`}
                                value={blogTargetId}
                                onChange={(e) => { setBlogTargetId(e.target.value); setPage(1); }}
                            />
                            <button onClick={resetBlogFilters} className="shrink-0 rounded-xl bg-secondary px-4 py-2 text-sm font-bold hover:bg-secondary/70 transition-colors">
                                Reset
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[300px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                            <Loader />
                        </div>
                    )}

                    {activeTab === 'users' ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Thời gian</th>
                                    <th className="px-6 py-4">Hành động</th>
                                    <th className="px-6 py-4">Người thực hiện</th>
                                    <th className="px-6 py-4">Mục tiêu</th>
                                    <th className="px-6 py-4">Lý do</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y relative">
                                {usersAudit.data?.logs?.map((log: AdminAuditLog) => (
                                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => setSelectedUserLog(log)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{log.actorUser?.fullName || 'Hệ thống'}</span>
                                                <span className="text-[10px] text-muted-foreground">{log.actorUser?.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{log.targetUser?.fullName || 'N/A'}</span>
                                                <span className="text-[10px] text-muted-foreground">{log.targetUser?.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs italic max-w-[220px] truncate">
                                            {log.reason || '-'}
                                        </td>
                                    </tr>
                                ))}

                                {usersAudit.data?.logs?.length === 0 && !usersAudit.isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            Chưa có nhật ký người dùng nào khớp bộ lọc hiện tại.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Thời gian</th>
                                    <th className="px-6 py-4">Hành động</th>
                                    <th className="px-6 py-4">Người thực hiện</th>
                                    <th className="px-6 py-4">Đối tượng</th>
                                    <th className="px-6 py-4">Target ID</th>
                                    <th className="px-6 py-4">Lý do</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y relative">
                                {blogsAudit.data?.logs?.map((log: AdminBlogAuditLog) => (
                                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => setSelectedBlogLog(log)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{log.actorUser?.fullName || 'N/A'}</span>
                                                <span className="text-[10px] text-muted-foreground">{log.actorUser?.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${log.targetType === 'BLOG_POST' ? 'bg-primary/10 text-primary' : 'bg-fuchsia-500/10 text-fuchsia-500'}`}>
                                                {log.targetType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                            {log.targetId || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs italic max-w-[220px] truncate">
                                            {log.reason || '-'}
                                        </td>
                                    </tr>
                                ))}

                                {blogsAudit.data?.logs?.length === 0 && !blogsAudit.isLoading && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            Chưa có nhật ký blog nào khớp bộ lọc hiện tại.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {!isLoading && data?.pagination && data.pagination.totalPages > 1 && (
                        <div className="border-t p-4 flex items-center justify-between bg-muted/10">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                Trang trước
                            </button>
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <span className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-lg">{data.pagination.page}</span>
                                <span className="text-muted-foreground">/ {data.pagination.totalPages}</span>
                            </div>
                            <button
                                disabled={page >= data.pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:scale-105 active:scale-95 transition-all"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {selectedUserLog ? (
                <div className="fixed inset-0 z-[140] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUserLog(null)}>
                    <div className="w-full max-w-xl rounded-[24px] border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Drill-down</div>
                                <h3 className="mt-1 text-xl font-bold">User audit detail</h3>
                            </div>
                            <button onClick={() => setSelectedUserLog(null)} className="rounded-full bg-secondary p-2"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-6 grid gap-3 text-sm">
                            <div><span className="font-bold">Action:</span> {selectedUserLog.action}</div>
                            <div><span className="font-bold">Actor:</span> {selectedUserLog.actorUser?.fullName || 'Hệ thống'} ({selectedUserLog.actorUser?.email || '—'})</div>
                            <div><span className="font-bold">Target:</span> {selectedUserLog.targetUser?.fullName || 'N/A'} ({selectedUserLog.targetUser?.email || '—'})</div>
                            <div><span className="font-bold">Time:</span> {new Date(selectedUserLog.createdAt).toLocaleString('vi-VN')}</div>
                            <div><span className="font-bold">Reason:</span> {selectedUserLog.reason || '-'}</div>
                        </div>
                    </div>
                </div>
            ) : null}

            {selectedBlogLog ? (
                <div className="fixed inset-0 z-[140] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedBlogLog(null)}>
                    <div className="w-full max-w-xl rounded-[24px] border bg-background p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Drill-down</div>
                                <h3 className="mt-1 text-xl font-bold">Blog audit detail</h3>
                            </div>
                            <button onClick={() => setSelectedBlogLog(null)} className="rounded-full bg-secondary p-2"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-6 grid gap-3 text-sm">
                            <div><span className="font-bold">Action:</span> {selectedBlogLog.action}</div>
                            <div><span className="font-bold">Actor:</span> {selectedBlogLog.actorUser?.fullName || 'N/A'} ({selectedBlogLog.actorUser?.email || '—'})</div>
                            <div><span className="font-bold">Target type:</span> {selectedBlogLog.targetType}</div>
                            <div><span className="font-bold">Target ID:</span> {selectedBlogLog.targetId || '—'}</div>
                            <div><span className="font-bold">Time:</span> {new Date(selectedBlogLog.createdAt).toLocaleString('vi-VN')}</div>
                            <div><span className="font-bold">Reason:</span> {selectedBlogLog.reason || '-'}</div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
