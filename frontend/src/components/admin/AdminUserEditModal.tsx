import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Key } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUserApi } from '../../lib/adminUserApi';
import type { UserRole } from '../../lib/adminUserApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../ui/Loader';
import { AdminActionDialog } from './AdminActionDialog';

type AdminUserEditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
};

export const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({ isOpen, onClose, userId }) => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: userId ? adminQueryKeys.user(userId) : ['adminUser', 'empty'],
        queryFn: () => adminUserApi.getUserById(userId!),
        enabled: isOpen && !!userId,
    });
    const user = data?.user;

    // Account state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('STUDENT');
    const [emailVerified, setEmailVerified] = useState(false);

    // Profile state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [location, setLocation] = useState('');
    const [jobTitle, setJobTitle] = useState('');

    const [reason, setReason] = useState('Admin update');
    const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setRole(user.role || 'STUDENT');
            setEmailVerified(user.emailVerified || false);
            setPhoneNumber(user.profile?.phoneNumber || '');
            setLocation(user.profile?.location || '');
            setJobTitle(user.profile?.jobTitle || '');
            setReason('Admin update');
        }
        setErrorMessage(null);
    }, [user]);

    const invalidateUserData = () => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.usersRoot });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.userStats });
        if (userId) {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
        }
    };

    const accountMutation = useMutation({
        mutationFn: () => adminUserApi.updateAccount(user!.id, { fullName, email, emailVerified, reason }),
        onSuccess: () => invalidateUserData(),
    });

    const profileMutation = useMutation({
        mutationFn: () => adminUserApi.updateProfile(user!.id, { phoneNumber, location, jobTitle, reason }),
        onSuccess: () => invalidateUserData(),
    });

    const roleMutation = useMutation({
        mutationFn: () => adminUserApi.updateRole(user!.id, { role: role as 'STUDENT' | 'MENTOR', reason }),
        onSuccess: () => invalidateUserData(),
    });

    const revokeMutation = useMutation({
        mutationFn: (revokeReason: string) => adminUserApi.revokeSessions(user!.id, { reason: revokeReason }),
        onSuccess: () => {
            invalidateUserData();
            setRevokeDialogOpen(false);
        }
    });

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!user) {
            return;
        }

        try {
            await accountMutation.mutateAsync();
            await profileMutation.mutateAsync();
            if (role !== user.role) {
                if (role !== 'ADMIN') {
                    await roleMutation.mutateAsync();
                }
            }
            setErrorMessage(null);
            onClose();
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Cập nhật người dùng thất bại');
        }
    };

    const handleRevoke = () => {
        if (!user) {
            return;
        }

        setRevokeDialogOpen(true);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="bg-card w-full max-w-2xl rounded-[32px] border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-background z-10">
                        <div>
                            <h2 className="text-2xl font-black">Sửa Thông Tin</h2>
                            <span className="text-sm font-medium text-muted-foreground">ID: <span className="font-mono">{user?.id ?? '—'}</span></span>
                        </div>
                        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:scale-105 transition-transform"><X className="w-5 h-5" /></button>
                    </div>

                    {errorMessage ? (
                        <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3 text-sm font-medium text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
                        {isLoading && (
                            <div className="flex min-h-[320px] items-center justify-center">
                                <Loader />
                            </div>
                        )}

                        {!isLoading && !user && (
                            <div className="flex min-h-[320px] items-center justify-center text-sm font-medium text-muted-foreground">
                                Không thể tải chi tiết người dùng.
                            </div>
                        )}

                        {!isLoading && user && <>
                        {/* Account Details */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground">Tài Khoản Gốc</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold px-1">Họ và Tên</label>
                                    <input type="text" className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary" value={fullName} onChange={e => setFullName(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold px-1">Email</label>
                                    <input type="email" className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold px-1">Phân quyền</label>
                                    <select disabled={user.role === 'ADMIN'} className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-primary disabled:opacity-50" value={role} onChange={e => setRole(e.target.value as UserRole)}>
                                        <option value="STUDENT">STUDENT</option>
                                        <option value="MENTOR">MENTOR</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-6 px-1">
                                    <input type="checkbox" id="emailVerified" checked={emailVerified} onChange={e => setEmailVerified(e.target.checked)} className="w-5 h-5 rounded accent-primary" />
                                    <label htmlFor="emailVerified" className="text-sm font-bold">Email đã xác minh</label>
                                </div>
                            </div>
                        </section>

                        {/* Profile Extra */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-sm tracking-widest uppercase text-muted-foreground">Hồ Sơ Nâng Cao</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold px-1">Số điện thoại</label>
                                    <input type="text" className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold px-1">Vị trí địa lý</label>
                                    <input type="text" className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary" value={location} onChange={e => setLocation(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1 col-span-2">
                                    <label className="text-xs font-bold px-1">Chức danh công việc / Học vấn</label>
                                    <input type="text" className="bg-secondary/30 border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1 col-span-2">
                                    <label className="text-xs font-bold px-1 text-amber-500">Lý do thay đổi (bắt buộc cho Audit Log)</label>
                                    <input type="text" placeholder="Lý do cập nhật..." className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-amber-500" value={reason} onChange={e => setReason(e.target.value)} />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-destructive/20 border-dashed">
                            <h3 className="font-bold text-sm tracking-widest uppercase text-destructive flex items-center gap-2"><Key className="w-4 h-4" /> Security Zone</h3>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">Thu hồi phiên (Revoke Sessions)</span>
                                    <span className="text-xs text-muted-foreground">Log out thiết bị kết nối đáng ngờ, bảo vệ dữ liệu.</span>
                                </div>
                                <button onClick={handleRevoke} disabled={revokeMutation.isPending} className="bg-destructive hover:bg-destructive/90 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50">
                                    Bắt buộc Đăng xuất
                                </button>
                            </div>
                        </section>
                        </>}

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-background flex items-center justify-end z-10 gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold bg-secondary hover:bg-secondary/70 transition-colors">Hủy</button>
                        <button
                            disabled={!user || accountMutation.isPending || profileMutation.isPending || roleMutation.isPending}
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
            <AdminActionDialog
                isOpen={revokeDialogOpen}
                title="Thu hồi toàn bộ phiên đăng nhập"
                description="Người dùng sẽ bị đăng xuất khỏi các phiên đang hoạt động và thao tác này sẽ được ghi lại trong audit log."
                inputLabel="Lý do hủy phiên"
                inputPlaceholder="Bảo mật hệ thống"
                inputDefaultValue="Bảo mật hệ thống"
                requireInput
                confirmText="Thu hồi phiên"
                tone="destructive"
                isPending={revokeMutation.isPending}
                onClose={() => setRevokeDialogOpen(false)}
                onConfirm={(revokeReason) => revokeMutation.mutate(revokeReason)}
            />
        </div>,
        document.body,
    );
};
