import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '../../lib/blogApi';
import type { BlogPost } from '../../lib/blogApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { useMemo, useState } from 'react';
import { Settings, PenTool, CheckSquare, Trash2, RefreshCcw, FileText, Send, MessageSquareText, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminBlogFormModal } from '../../components/admin/AdminBlogFormModal';
import { AdminActionDialog } from '../../components/admin/AdminActionDialog';

const BLOG_STATUS_LABEL: Record<BlogPost['status'], string> = {
    DRAFT: 'Nháp',
    SCHEDULED: 'Lên lịch đăng',
    PUBLISHED: 'Đã xuất bản',
};

export default function AdminBlogsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'deleted'>('all');
    const [search, setSearch] = useState('');
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'edit' | 'preview'>('edit');
    const [previewPostId, setPreviewPostId] = useState<string | null>(null);
    const [actionDialog, setActionDialog] = useState<{
        open: boolean;
        type: 'delete' | 'restore' | 'publish' | 'bulkDelete' | 'bulkRestore' | 'bulkPublish';
        postId?: string;
    }>({ open: false, type: 'publish' });

    const queryClient = useQueryClient();
    const postsQuery = useMemo(
        () => ({ page, limit: 10, status: activeTab, search }),
        [page, activeTab, search],
    );

    const { data, isLoading } = useQuery({
        queryKey: adminQueryKeys.posts(postsQuery),
        queryFn: () => blogApi.adminList({ page, limit: 10, status: activeTab, search: search || undefined }),
    });

    const invalidateBlogData = (postId?: string) => {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.postsRoot });
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.blogStats });
        if (postId) {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.post(postId) });
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogApi.adminDelete(id),
        onSuccess: (_data, id) => {
            invalidateBlogData(id);
        }
    });

    const restoreMutation = useMutation({
        mutationFn: (id: string) => blogApi.adminRestore(id),
        onSuccess: (_data, id) => {
            invalidateBlogData(id);
        }
    });

    const publishMutation = useMutation({
        mutationFn: (id: string) => blogApi.adminPublish(id),
        onSuccess: (_data, id) => {
            invalidateBlogData(id);
            setActionDialog({ open: false, type: 'publish' });
        }
    });

    const previewMutation = useMutation({
        mutationFn: (id: string) => blogApi.adminPreview(id),
        onSuccess: (_data, id) => {
            openPreviewForm(id);
        }
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => blogApi.adminBulkDelete(ids),
        onSuccess: () => {
            invalidateBlogData();
            setSelectedPostIds([]);
            setActionDialog({ open: false, type: 'bulkDelete' });
        }
    });

    const bulkRestoreMutation = useMutation({
        mutationFn: (ids: string[]) => blogApi.adminBulkRestore(ids),
        onSuccess: () => {
            invalidateBlogData();
            setSelectedPostIds([]);
            setActionDialog({ open: false, type: 'bulkRestore' });
        }
    });

    const bulkPublishMutation = useMutation({
        mutationFn: (ids: string[]) => blogApi.adminBulkPublish(ids),
        onSuccess: () => {
            invalidateBlogData();
            setSelectedPostIds([]);
            setActionDialog({ open: false, type: 'bulkPublish' });
        }
    });

    const handleDelete = (id: string) => {
        setActionDialog({ open: true, type: 'delete', postId: id });
    };

    const handleRestore = (id: string) => {
        setActionDialog({ open: true, type: 'restore', postId: id });
    };

    const handlePublish = (id: string) => {
        setActionDialog({ open: true, type: 'publish', postId: id });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked && data?.posts) {
            setSelectedPostIds(data.posts.map((p: BlogPost) => p.id));
        } else {
            setSelectedPostIds([]);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedPostIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const openEditForm = (post: BlogPost) => {
        setPreviewPostId(null);
        setEditingPostId(post.id);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    const openPreviewForm = (postId: string) => {
        setEditingPostId(null);
        setPreviewPostId(postId);
        setFormMode('preview');
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingPostId(null);
        setPreviewPostId(null);
        setFormMode('edit');
    };

    const openCreateForm = () => {
        setPreviewPostId(null);
        setEditingPostId(null);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    const isMutating = deleteMutation.isPending || restoreMutation.isPending ||
        publishMutation.isPending || bulkDeleteMutation.isPending ||
        bulkRestoreMutation.isPending || bulkPublishMutation.isPending;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý Bài viết</h1>
                    <p className="text-sm text-muted-foreground">
                        Trung tâm kiểm duyệt và xuất bản blog.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/blog-comments')} className="bg-secondary text-foreground font-bold px-4 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                        <MessageSquareText className="w-4 h-4" /> Bình luận
                    </button>
                    <button onClick={openCreateForm} className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2">
                        <PenTool className="w-4 h-4" /> Viết bài mới
                    </button>
                </div>
            </div>

            {/* Search + Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết..."
                        className="w-full bg-secondary/50 rounded-xl py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:ring-2 border-none"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setActiveTab('all'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Tất cả</button>
                    <button onClick={() => { setActiveTab('published'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'published' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Đã xuất bản</button>
                    <button onClick={() => { setActiveTab('draft'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'draft' ? 'bg-amber-500 text-white shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Bản nháp</button>
                    <button onClick={() => { setActiveTab('deleted'); setPage(1); }} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === 'deleted' ? 'bg-destructive text-white shadow-sm' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>Đã xóa</button>
                </div>
            </div>

            {
                selectedPostIds.length > 0 && (
                    <div className="bg-primary/10 border-primary border p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-sm">
                        <span className="font-bold text-sm text-primary flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Đã chọn {selectedPostIds.length} bài viết</span>
                        <div className="flex items-center gap-2">
                            <button disabled={isMutating} onClick={() => setActionDialog({ open: true, type: 'bulkPublish' })} className="text-xs font-bold px-3 py-1.5 bg-emerald-500 text-white flex items-center gap-1 rounded-lg hover:scale-105 active:scale-95 transition-all"><Send className="w-3 h-3" /> Xuất bản</button>
                            <button disabled={isMutating} onClick={() => setActionDialog({ open: true, type: 'bulkRestore' })} className="text-xs font-bold px-3 py-1.5 bg-blue-500 text-white flex items-center gap-1 rounded-lg hover:scale-105 active:scale-95 transition-all"><RefreshCcw className="w-3 h-3" /> Khôi phục</button>
                            <div className="w-px h-6 bg-primary/20 mx-2"></div>
                            <button disabled={isMutating} onClick={() => setActionDialog({ open: true, type: 'bulkDelete' })} className="text-xs font-bold px-3 py-1.5 bg-destructive text-white flex items-center gap-1 hover:bg-destructive/90 rounded-lg hover:scale-105 active:scale-95 transition-all"><Trash2 className="w-3 h-3" /> Xóa</button>
                        </div>
                    </div>
                )
            }

            <div className="overflow-hidden rounded-[24px] border bg-background shadow-sm relative min-h-[300px]">
                {(isLoading || isMutating || previewMutation.isPending) && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                        <Loader />
                    </div>
                )}
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4 w-[60px]">
                                <input type="checkbox" className="w-4 h-4 rounded accent-primary border-muted" onChange={handleSelectAll} checked={!!data?.posts?.length && selectedPostIds.length === data?.posts?.length} />
                            </th>
                            <th className="px-6 py-4">Bài viết</th>
                            <th className="px-6 py-4">Nội dung</th>
                            <th className="px-6 py-4 text-center">Lượt xem</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {data?.posts?.map((post: BlogPost) => (
                            <tr key={post.id} className={`transition-colors ${selectedPostIds.includes(post.id) ? 'bg-primary/5' : 'hover:bg-secondary/10'} ${post.deletedAt ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <input type="checkbox" className="w-4 h-4 rounded accent-primary border-muted" checked={selectedPostIds.includes(post.id)} onChange={() => handleSelect(post.id)} />
                                </td>
                                <td className="px-6 py-4 max-w-[250px]">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold truncate" title={post.title}>{post.title}</span>
                                        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded truncate max-w-max">/{post.slug}</span>
                                        <div className="flex items-center text-[10px] text-muted-foreground font-mono mt-1 gap-2">
                                            <span>👍 {post.likes}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-[200px]">
                                    <p className="text-xs text-muted-foreground line-clamp-1" title={post.excerpt || post.content}>{post.excerpt || post.content}</p>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-bold">
                                    {post.views?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    {post.deletedAt ? (
                                        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-destructive/10 text-destructive line-through">
                                            ĐÃ XÓA
                                        </span>
                                    ) : (
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${post.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500' :
                                            post.status === 'SCHEDULED' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                                            }`}>
                                            {BLOG_STATUS_LABEL[post.status]}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <button onClick={() => openEditForm(post)} className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors" title="Sửa bài viết">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openEditForm(post)} className="text-secondary-foreground hover:bg-secondary p-1.5 rounded-lg transition-colors" title="Cấu hình Meta/Tags">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => previewMutation.mutate(post.id)} className="text-indigo-500 hover:bg-indigo-500/10 p-1.5 rounded-lg transition-colors" title="Xem trước từ backend">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/blog-comments?postId=${post.id}`)}
                                        className="text-secondary-foreground hover:bg-secondary p-1.5 rounded-lg transition-colors"
                                        title="Xem bình luận của bài viết"
                                    >
                                        <MessageSquareText className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-4 bg-muted mx-1"></div>

                                    {post.deletedAt ? (
                                        <button
                                            onClick={() => handleRestore(post.id)}
                                            disabled={isMutating}
                                            className="text-blue-500 font-bold hover:bg-blue-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50">Khôi phục</button>
                                    ) : (
                                        <>
                                            {post.status !== 'PUBLISHED' && (
                                                <button onClick={() => handlePublish(post.id)} disabled={isMutating} className="text-emerald-500 font-bold hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors disabled:opacity-50">Xuất bản</button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                disabled={isMutating}
                                                className="text-destructive font-bold hover:bg-destructive/10 px-2 py-1 rounded transition-colors disabled:opacity-50">Xóa</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {data?.posts?.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    Chưa có bài viết nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Header */}
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

            <AdminBlogFormModal isOpen={isFormOpen} onClose={closeForm} postId={editingPostId ?? previewPostId} initialMode={formMode} />
            <AdminActionDialog
                isOpen={actionDialog.open}
                title={actionDialog.type === 'delete' ? 'Lưu trữ bài viết' : actionDialog.type === 'restore' ? 'Khôi phục bài viết' : actionDialog.type === 'publish' ? 'Xuất bản bài viết' : actionDialog.type === 'bulkDelete' ? 'Lưu trữ hàng loạt' : actionDialog.type === 'bulkRestore' ? 'Khôi phục hàng loạt' : 'Xuất bản hàng loạt'}
                description={actionDialog.type === 'delete' ? 'Bài viết sẽ được chuyển sang trạng thái đã xóa mềm.' : actionDialog.type === 'restore' ? 'Bài viết đã xóa mềm sẽ được đưa trở lại danh sách hoạt động.' : actionDialog.type === 'publish' ? 'Bài viết sẽ được xuất bản công khai ngay lập tức.' : `Thao tác này sẽ áp dụng cho ${selectedPostIds.length} bài viết đã chọn.`}
                confirmText={actionDialog.type === 'delete' || actionDialog.type === 'bulkDelete' ? 'Xác nhận xóa' : actionDialog.type === 'restore' || actionDialog.type === 'bulkRestore' ? 'Khôi phục' : 'Xuất bản'}
                tone={actionDialog.type === 'delete' || actionDialog.type === 'bulkDelete' ? 'destructive' : actionDialog.type === 'publish' || actionDialog.type === 'bulkPublish' ? 'success' : 'primary'}
                isPending={deleteMutation.isPending || restoreMutation.isPending || publishMutation.isPending || bulkDeleteMutation.isPending || bulkRestoreMutation.isPending || bulkPublishMutation.isPending}
                onClose={() => setActionDialog({ open: false, type: 'publish' })}
                onConfirm={() => {
                    if (actionDialog.type === 'delete' && actionDialog.postId) deleteMutation.mutate(actionDialog.postId);
                    if (actionDialog.type === 'restore' && actionDialog.postId) restoreMutation.mutate(actionDialog.postId);
                    if (actionDialog.type === 'publish' && actionDialog.postId) publishMutation.mutate(actionDialog.postId);
                    if (actionDialog.type === 'bulkDelete') bulkDeleteMutation.mutate(selectedPostIds);
                    if (actionDialog.type === 'bulkRestore') bulkRestoreMutation.mutate(selectedPostIds);
                    if (actionDialog.type === 'bulkPublish') bulkPublishMutation.mutate(selectedPostIds);
                }}
            />
        </div >
    );
}
