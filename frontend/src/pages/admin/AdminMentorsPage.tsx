import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMentorApi } from '../../lib/adminMentorApi';
import type { AdminMentor } from '../../lib/adminMentorApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { useMemo, useState } from 'react';
import { Search, UserPlus, Settings } from 'lucide-react';
import { AdminMentorFormModal } from '../../components/admin/AdminMentorFormModal';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';

const MENTOR_LEVEL_LABEL: Record<string, string> = {
    STUDENT: 'Sinh viên',
    FRESHER: 'Fresher',
    JUNIOR: 'Junior',
    MIDDLE: 'Middle',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    ARCHITECT: 'Architect',
    MANAGER: 'Quản lý',
};

export default function AdminMentorsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'PAUSED'>('all');
    const [editingMentorId, setEditingMentorId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        type: 'verify' | 'unverify' | 'activate' | 'pause';
        mentorId?: string;
    }>({ open: false, type: 'verify' });
    const queryClient = useQueryClient();
    const mentorsQuery = useMemo(
        () => ({ page, limit: 10, search, status: statusFilter }),
        [page, search, statusFilter],
    );

    const { data, isLoading } = useQuery({
        queryKey: adminQueryKeys.mentors(mentorsQuery),
        queryFn: () => adminMentorApi.listMentors({ page, limit: 10, search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter as any }),
    });

    const invalidateMentorData = (mentorId?: string) => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.mentorsRoot });
        if (mentorId) {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.mentor(mentorId) });
        }
    };

    const verifyMutation = useMutation({
        mutationFn: ({ id, isVerified }: { id: string, isVerified: boolean }) => adminMentorApi.updateMentorVerification(id, isVerified),
        onSuccess: (_data, variables) => {
            invalidateMentorData(variables.id);
            setActionDialog({ open: false, type: 'verify' });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'ACTIVE' | 'PAUSED' }) => adminMentorApi.updateMentorStatus(id, status),
        onSuccess: (_data, variables) => {
            invalidateMentorData(variables.id);
            setActionDialog({ open: false, type: 'verify' });
        },
    });

    const handleVerify = (id: string, isVerified: boolean) => {
        setActionDialog({ open: true, type: isVerified ? 'verify' : 'unverify', mentorId: id });
    };

    const handleStatus = (id: string, status: 'ACTIVE' | 'PAUSED') => {
        setActionDialog({ open: true, type: status === 'ACTIVE' ? 'activate' : 'pause', mentorId: id });
    };

    const openCreateForm = () => { setEditingMentorId(null); setIsFormOpen(true); };
    const openEditForm = (mentor: AdminMentor) => { setEditingMentorId(mentor.id); setIsFormOpen(true); };

    const isMutating = verifyMutation.isPending || statusMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Mentor</h1>
                    <p className="text-sm text-muted-foreground">
                        Phê duyệt, quản lý hồ sơ và trạng thái Mentor.
                    </p>
                </div>
                <button onClick={openCreateForm} className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Tạo Mentor mới
                </button>
            </div>

            {/* Search + Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm mentor theo tên..."
                        className="w-full bg-secondary/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:ring-2 border-none"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setStatusFilter('all'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Tất cả</button>
                    <button onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${statusFilter === 'ACTIVE' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Hoạt động</button>
                    <button onClick={() => { setStatusFilter('PAUSED'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${statusFilter === 'PAUSED' ? 'bg-amber-500 text-white shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Tạm ngưng</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/30 rounded-2xl p-4 flex flex-col gap-1 border">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tổng Mentor</span>
                    <span className="text-2xl font-bold">{data?.summary?.total || 0}</span>
                </div>
                <div className="bg-secondary/30 rounded-2xl p-4 flex flex-col gap-1 border">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Đã Xác thực</span>
                    <span className="text-2xl font-bold text-emerald-500">{data?.summary?.verified || 0}</span>
                </div>
                <div className="bg-secondary/30 rounded-2xl p-4 flex flex-col gap-1 border">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Hoạt động</span>
                    <span className="text-2xl font-bold text-primary">{data?.summary?.active || 0}</span>
                </div>
                <div className="bg-secondary/30 rounded-2xl p-4 flex flex-col gap-1 border">
                    <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tạm ngưng</span>
                    <span className="text-2xl font-bold text-amber-500">{data?.summary?.paused || 0}</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[300px]">
                {(isLoading || isMutating) && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader />
                    </div>
                )}
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4">Mentor</th>
                            <th className="px-6 py-4">Lĩnh vực / Chức danh</th>
                            <th className="px-6 py-4">Cấp độ</th>
                            <th className="px-6 py-4">Xác thực</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {data?.mentors?.map((mentor) => (
                            <tr key={mentor.id} className="hover:bg-secondary/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold truncate max-w-[200px]">{mentor.name}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{mentor.user?.email || mentor.slug}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-[200px]">
                                    <div className="flex flex-col">
                                        <span className="font-semibold truncate">{mentor.expertiseArea || 'Chưa cập nhật'}</span>
                                        <span className="text-xs text-muted-foreground truncate">{mentor.currentJobTitle || 'Chưa cập nhật'} @ {mentor.currentCompany || 'Chưa cập nhật'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${mentor.level === 'ARCHITECT' || mentor.level === 'LEAD' ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}>
                                        {mentor.level ? (MENTOR_LEVEL_LABEL[mentor.level] ?? mentor.level.replace('_', ' ')) : 'Chưa cập nhật'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {mentor.isVerified ? (
                                        <span className="text-emerald-500 font-bold text-xs uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Đã xác thực</span>
                                    ) : (
                                        <span className="text-amber-500 font-bold text-xs uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Chờ duyệt</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditForm(mentor)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" title="Sửa mentor">
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        {mentor.isVerified ? (
                                            <button onClick={() => handleVerify(mentor.id, false)} disabled={isMutating} className="text-destructive font-bold hover:bg-destructive/10 px-2 py-1 rounded text-xs disabled:opacity-50">Gỡ duyệt</button>
                                        ) : (
                                            <button onClick={() => handleVerify(mentor.id, true)} disabled={isMutating} className="text-emerald-500 font-bold hover:bg-emerald-50 px-2 py-1 rounded text-xs disabled:opacity-50">Phê duyệt</button>
                                        )}
                                        {mentor.status === 'ACTIVE' ? (
                                            <button onClick={() => handleStatus(mentor.id, 'PAUSED')} disabled={isMutating} className="text-amber-500 font-bold hover:bg-amber-500/10 px-2 py-1 rounded text-xs disabled:opacity-50">Ngưng</button>
                                        ) : (
                                            <button onClick={() => handleStatus(mentor.id, 'ACTIVE')} disabled={isMutating} className="text-primary font-bold hover:bg-primary/10 px-2 py-1 rounded text-xs disabled:opacity-50">Kích hoạt</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {data?.mentors?.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Không có mentor nào trên hệ thống.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!isLoading && data?.pagination && data.pagination.totalPages > 1 && (
                    <div className="border-t p-4 flex items-center justify-between bg-muted/10">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:scale-105 active:scale-95 transition-all">Trang trước</button>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <span className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-lg">{data.pagination.page}</span>
                            <span className="text-muted-foreground">/ {data.pagination.totalPages}</span>
                        </div>
                        <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:scale-105 active:scale-95 transition-all">Trang sau</button>
                    </div>
                )}
            </div>

            <AdminMentorFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} mentorId={editingMentorId} />
            <AdminActionDialog
                isOpen={actionDialog.open}
                title={actionDialog.type === 'verify' ? 'Phê duyệt mentor' : actionDialog.type === 'unverify' ? 'Gỡ phê duyệt mentor' : actionDialog.type === 'activate' ? 'Kích hoạt mentor' : 'Tạm ngưng mentor'}
                description={actionDialog.type === 'verify' ? 'Mentor sẽ được đánh dấu đã xác thực và hiển thị với trạng thái tin cậy hơn.' : actionDialog.type === 'unverify' ? 'Mentor sẽ bị gỡ trạng thái xác thực cho đến khi được duyệt lại.' : actionDialog.type === 'activate' ? 'Mentor sẽ quay lại trạng thái hoạt động.' : 'Mentor sẽ bị tạm ngưng khỏi luồng hoạt động hiện tại.'}
                confirmText={actionDialog.type === 'verify' ? 'Phê duyệt' : actionDialog.type === 'unverify' ? 'Gỡ phê duyệt' : actionDialog.type === 'activate' ? 'Kích hoạt' : 'Tạm ngưng'}
                tone={actionDialog.type === 'verify' || actionDialog.type === 'activate' ? 'success' : actionDialog.type === 'pause' ? 'warning' : 'destructive'}
                isPending={verifyMutation.isPending || statusMutation.isPending}
                onClose={() => setActionDialog({ open: false, type: 'verify' })}
                onConfirm={() => {
                    if (!actionDialog.mentorId) return;
                    if (actionDialog.type === 'verify') verifyMutation.mutate({ id: actionDialog.mentorId, isVerified: true });
                    if (actionDialog.type === 'unverify') verifyMutation.mutate({ id: actionDialog.mentorId, isVerified: false });
                    if (actionDialog.type === 'activate') statusMutation.mutate({ id: actionDialog.mentorId, status: 'ACTIVE' });
                    if (actionDialog.type === 'pause') statusMutation.mutate({ id: actionDialog.mentorId, status: 'PAUSED' });
                }}
            />
        </div>
    );
}
