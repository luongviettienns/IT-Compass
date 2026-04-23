import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminUserApi } from '../../lib/adminUserApi';
import type { UserStatus } from '../../lib/adminUserApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { useMemo, useState } from 'react';
import { AdminUserEditModal } from '../../components/admin/AdminUserEditModal';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';
import { Key, CheckSquare, Settings, Search } from 'lucide-react';
import { getRoleBadge, getUserStatusLabel } from '../../lib/userDisplay';

export default function AdminUsersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'blocked'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [statusDialog, setStatusDialog] = useState<{ open: boolean; id: string | null; status: UserStatus; actionLabel: string }>({
        open: false,
        id: null,
        status: 'ACTIVE',
        actionLabel: '',
    });
    const [bulkStatusDialog, setBulkStatusDialog] = useState<{ open: boolean; status: UserStatus }>({ open: false, status: 'ACTIVE' });
    const [bulkRevokeDialogOpen, setBulkRevokeDialogOpen] = useState(false);

    const queryClient = useQueryClient();
    const usersQuery = useMemo(
        () => ({ page, limit: 10, search, status: statusFilter }),
        [page, search, statusFilter],
    );

    const { data, isLoading } = useQuery({
        queryKey: adminQueryKeys.users(usersQuery),
        queryFn: () => adminUserApi.listUsers({ page, limit: 10, search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase() as any }),
    });

    const invalidateUsersData = (userId?: string) => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersRoot });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.userStats });
        if (userId) {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
        }
    };

    const statusMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: UserStatus; reason: string }) =>
            adminUserApi.updateStatus(id, { status, reason }),
        onSuccess: (_data, variables) => {
            invalidateUsersData(variables.id);
            setStatusDialog({ open: false, id: null, status: 'ACTIVE', actionLabel: '' });
        },
    });

    const bulkStatusMutation = useMutation({
        mutationFn: ({ userIds, status, reason }: { userIds: string[]; status: UserStatus; reason: string }) =>
            adminUserApi.bulkUpdateStatus({ userIds, status, reason }),
        onSuccess: () => {
            invalidateUsersData();
            setSelectedUserIds([]);
            setBulkStatusDialog({ open: false, status: 'ACTIVE' });
        }
    });

    const bulkRevokeMutation = useMutation({
        mutationFn: ({ userIds, reason }: { userIds: string[]; reason: string }) =>
            adminUserApi.bulkRevokeSessions({ userIds, reason }),
        onSuccess: () => {
            invalidateUsersData();
            setSelectedUserIds([]);
            setBulkRevokeDialogOpen(false);
        }
    });

    const handleUpdateStatus = (id: string, currentStatus: UserStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        const actionLabel = newStatus === 'ACTIVE' ? 'Mở khóa' : 'Khóa';
        setStatusDialog({ open: true, id, status: newStatus, actionLabel });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && data?.users) {
            setSelectedUserIds(data.users.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleBulkStatus = (status: UserStatus) => {
        if (!selectedUserIds.length) return;
        setBulkStatusDialog({ open: true, status });
    };

    const handleBulkRevoke = () => {
        if (!selectedUserIds.length) return;
        setBulkRevokeDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Người dùng</h1>
                    <p className="text-sm text-muted-foreground">
                        Danh sách tài khoản và phân quyền trên hệ thống.
                        Tổng cộng: <span className="font-bold">{data?.summary?.total || 0}</span> người dùng.
                    </p>
                </div>
            </div>

            {/* Search + Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc email..."
                        className="w-full bg-secondary/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:ring-2 border-none"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(['all', 'active', 'suspended', 'blocked'] as const).map(tab => (
                        <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${statusFilter === tab
                                ? tab === 'all' ? 'bg-primary text-primary-foreground shadow-sm'
                                    : tab === 'active' ? 'bg-emerald-500 text-white shadow-sm'
                                        : tab === 'suspended' ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-destructive text-white shadow-sm'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                            }`}>
                            {tab === 'all' ? 'Tất cả' : tab === 'active' ? 'Hoạt động' : tab === 'suspended' ? 'Tạm ngưng' : 'Bị chặn'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedUserIds.length > 0 && (
                <div className="bg-primary/10 border-primary border p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                    <span className="font-bold text-sm text-primary flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Đã chọn {selectedUserIds.length} người dùng</span>
                    <div className="flex items-center gap-2">
                        <button disabled={bulkStatusMutation.isPending} onClick={() => handleBulkStatus('ACTIVE')} className="text-xs font-bold px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all">Mở khóa</button>
                        <button disabled={bulkStatusMutation.isPending} onClick={() => handleBulkStatus('SUSPENDED')} className="text-xs font-bold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all">Giao ngưng</button>
                        <button disabled={bulkStatusMutation.isPending} onClick={() => handleBulkStatus('BLOCKED')} className="text-xs font-bold px-3 py-1.5 bg-destructive text-white rounded-lg hover:scale-105 active:scale-95 transition-all">Chặn</button>
                        <div className="w-px h-6 bg-primary/20 mx-2"></div>
                        <button disabled={bulkRevokeMutation.isPending} onClick={handleBulkRevoke} className="text-xs font-bold px-3 py-1.5 bg-secondary text-foreground hover:bg-secondary/70 flex items-center gap-1 rounded-lg hover:scale-105 active:scale-95 transition-all"><Key className="w-3 h-3" /> Hủy phiên</button>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[300px]">
                {(isLoading || statusMutation.isPending || bulkStatusMutation.isPending || bulkRevokeMutation.isPending) && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader />
                    </div>
                )}
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4 w-[60px]">
                                <input type="checkbox" className="w-4 h-4 rounded accent-primary border-muted" onChange={handleSelectAll} checked={!!data?.users?.length && selectedUserIds.length === data?.users?.length} />
                            </th>
                            <th className="px-6 py-4">Tên & Email</th>
                            <th className="px-6 py-4">Vai trò</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4">Ngày tạo</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {data?.users?.map((user) => {
                            const roleBadge = getRoleBadge(user.role);

                            return (
                                <tr key={user.id} className={`transition-colors ${selectedUserIds.includes(user.id) ? 'bg-primary/5' : 'hover:bg-secondary/10'}`}>
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="w-4 h-4 rounded accent-primary border-muted" checked={selectedUserIds.includes(user.id)} onChange={() => handleSelect(user.id)} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{user.fullName} {user.hasProfile && <span className="text-[10px] font-medium px-1 bg-secondary rounded text-muted-foreground ml-1">Đã cấu hình</span>}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${roleBadge?.color ?? 'bg-secondary'}`}>
                                            {roleBadge?.label ?? user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 font-bold ${user.status === 'ACTIVE' ? 'text-emerald-500' :
                                            user.status === 'SUSPENDED' ? 'text-amber-500' : 'text-destructive'
                                            }`}>
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            {getUserStatusLabel(user.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingUserId(user.id)}
                                            className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" title="Chỉnh sửa chi tiết">
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        {user.status === 'ACTIVE' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(user.id, user.status)}
                                                disabled={statusMutation.isPending}
                                                className="text-destructive font-bold hover:bg-destructive/10 px-2 py-1 rounded transition-colors disabled:opacity-50">Khóa</button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(user.id, user.status)}
                                                disabled={statusMutation.isPending}
                                                className="text-emerald-500 font-bold hover:bg-emerald-50 px-2 py-1 rounded transition-colors disabled:opacity-50">Mở khóa</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {data?.users?.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    Không tìm thấy người dùng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Basic Pagination Header */}
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

            <AdminUserEditModal isOpen={!!editingUserId} userId={editingUserId} onClose={() => setEditingUserId(null)} />
            <AdminActionDialog
                isOpen={statusDialog.open}
                title={`${statusDialog.actionLabel} người dùng`}
                description="Hành động này sẽ cập nhật trạng thái tài khoản và ghi vào audit log."
                inputLabel="Lý do thay đổi"
                inputPlaceholder={`Quản trị viên thực hiện ${statusDialog.actionLabel.toLowerCase()}`}
                inputDefaultValue={`Quản trị viên thực hiện ${statusDialog.actionLabel.toLowerCase()}`}
                requireInput
                confirmText={statusDialog.actionLabel || 'Xác nhận'}
                tone={statusDialog.status === 'ACTIVE' ? 'success' : 'warning'}
                isPending={statusMutation.isPending}
                onClose={() => setStatusDialog({ open: false, id: null, status: 'ACTIVE', actionLabel: '' })}
                onConfirm={(reason) => {
                    if (!statusDialog.id) return;
                    statusMutation.mutate({ id: statusDialog.id, status: statusDialog.status, reason });
                }}
            />
            <AdminActionDialog
                isOpen={bulkStatusDialog.open}
                title="Đổi trạng thái hàng loạt"
                description={`Áp dụng cho ${selectedUserIds.length} người dùng đã chọn.`}
                inputLabel="Lý do thay đổi"
                inputPlaceholder="Quản trị hàng loạt"
                inputDefaultValue="Quản trị hàng loạt"
                requireInput
                confirmText={bulkStatusDialog.status === 'ACTIVE' ? 'Mở khóa hàng loạt' : bulkStatusDialog.status === 'SUSPENDED' ? 'Tạm ngưng hàng loạt' : 'Chặn hàng loạt'}
                tone={bulkStatusDialog.status === 'ACTIVE' ? 'success' : bulkStatusDialog.status === 'SUSPENDED' ? 'warning' : 'destructive'}
                isPending={bulkStatusMutation.isPending}
                onClose={() => setBulkStatusDialog({ open: false, status: 'ACTIVE' })}
                onConfirm={(reason) => {
                    bulkStatusMutation.mutate({ userIds: selectedUserIds, status: bulkStatusDialog.status, reason });
                }}
            />
            <AdminActionDialog
                isOpen={bulkRevokeDialogOpen}
                title="Hủy phiên đăng nhập hàng loạt"
                description={`Thu hồi phiên của ${selectedUserIds.length} người dùng đã chọn.`}
                inputLabel="Lý do hủy phiên"
                inputPlaceholder="Bảo mật hệ thống"
                inputDefaultValue="Bảo mật hệ thống"
                requireInput
                confirmText="Thu hồi phiên"
                tone="destructive"
                isPending={bulkRevokeMutation.isPending}
                onClose={() => setBulkRevokeDialogOpen(false)}
                onConfirm={(reason) => {
                    bulkRevokeMutation.mutate({ userIds: selectedUserIds, reason });
                }}
            />
        </div>
    );
}
