import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { adminUserApi, type AdminAuditLog, type AuditAction } from '../../lib/adminUserApi';
import { blogApi, type AdminBlogAuditAction, type AdminBlogAuditLog } from '../../lib/blogApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Nhật ký Hệ thống</h1>
                    <p className="text-sm text-muted-foreground">
                        Theo dõi thao tác quản trị cho người dùng và blog theo đúng dữ liệu backend đang cung cấp.
                    </p>
                </div>
            </div>

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
                                <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
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
                                <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
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
        </div>
    );
}
