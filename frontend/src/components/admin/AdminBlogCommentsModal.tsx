import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, EyeOff, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '../../lib/blogApi';
import type { BlogComment } from '../../lib/blogApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { AdminActionDialog } from './AdminActionDialog';

type CommentFilterStatus = 'all' | 'visible' | 'hidden' | 'deleted';

type AdminBlogCommentsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    postId?: string;
    initialSearch?: string;
    embedded?: boolean;
    title?: string;
    description?: string;
    showCloseButton?: boolean;
};

type AdminBlogCommentsManagerProps = {
    postId?: string;
    initialSearch?: string;
    embedded?: boolean;
    title?: string;
    description?: string;
    onClose?: () => void;
    showCloseButton?: boolean;
};

const FILTER_LABEL: Record<CommentFilterStatus, string> = {
    all: 'Tất cả',
    visible: 'Hiển thị',
    hidden: 'Đã ẩn',
    deleted: 'Bị xóa',
};

const AnonymousName = 'Ẩn danh';

export const AdminBlogCommentsManager: React.FC<AdminBlogCommentsManagerProps> = ({
    postId,
    initialSearch = '',
    embedded = false,
    title = 'Kiểm duyệt bình luận',
    description = 'Quản lý nội dung thảo luận trên toàn bộ blog.',
    onClose,
    showCloseButton = true,
}) => {
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<CommentFilterStatus>('all');
    const [search, setSearch] = useState(initialSearch);
    const [commentToDelete, setCommentToDelete] = useState<BlogComment | null>(null);

    const queryClient = useQueryClient();
    const query = useMemo(
        () => ({ page, limit: 10, status: filterStatus, search: search || undefined, postId }),
        [page, filterStatus, search, postId],
    );

    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    useEffect(() => {
        setPage(1);
    }, [filterStatus, postId]);

    const { data, isLoading } = useQuery({
        queryKey: adminQueryKeys.comments(query),
        queryFn: () => blogApi.adminListComments(query),
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'VISIBLE' | 'HIDDEN' }) =>
            blogApi.adminModerateComment(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.commentsRoot });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogApi.adminDeleteComment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.commentsRoot });
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.blogStats });
            setCommentToDelete(null);
        }
    });

    const handleToggleHide = (comment: BlogComment) => {
        const newStatus = comment.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
        moderateMutation.mutate({ id: comment.id, status: newStatus });
    };

    const handleDelete = (comment: BlogComment) => {
        setCommentToDelete(comment);
    };

    const clearPostFilter = () => {
        if (!postId || !onClose) return;
        onClose();
    };

    const shellClassName = embedded
        ? 'bg-card w-full rounded-[32px] border shadow-sm flex flex-col overflow-hidden'
        : 'bg-card w-full max-w-6xl max-h-[88vh] border shadow-2xl rounded-[32px] flex flex-col overflow-hidden';

    return (
        <>
            <div className={shellClassName}>
                <div className="flex items-center justify-between p-6 border-b shrink-0 bg-background z-10 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black">{title}</h2>
                            <p className="text-sm font-medium text-muted-foreground">{description}</p>
                            {postId ? (
                                <div className="mt-2 inline-flex items-center gap-2 rounded-full border bg-secondary/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Đang lọc theo bài viết
                                    {showCloseButton && onClose ? (
                                        <button type="button" onClick={clearPostFilter} className="text-primary hover:underline normal-case tracking-normal text-xs font-bold">
                                            Bỏ lọc
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {showCloseButton && onClose ? (
                        <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/70 transition-colors shrink-0"><X className="w-5 h-5" /></button>
                    ) : null}
                </div>

                <div className="p-4 border-b bg-muted/20 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        {(['all', 'visible', 'hidden', 'deleted'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setPage(1); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterStatus === status ? 'bg-primary text-primary-foreground' : 'bg-background border hover:bg-secondary'}`}
                            >
                                {FILTER_LABEL[status]}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end lg:min-w-[360px]">
                        <div className="relative w-full lg:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Tìm theo nội dung bình luận..."
                                className="w-full rounded-xl border bg-background py-2 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:ring-2"
                            />
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 bg-background border rounded-lg whitespace-nowrap">Tổng: {data?.pagination?.total || 0}</span>
                    </div>
                </div>

                <div className="p-0 overflow-y-auto flex-1 relative custom-scrollbar min-h-[360px]">
                    {(isLoading || moderateMutation.isPending || deleteMutation.isPending) && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                            <Loader />
                        </div>
                    )}

                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest border-b sticky top-0 z-10 bg-background">
                            <tr>
                                <th className="px-6 py-4">Người dùng</th>
                                <th className="px-6 py-4 w-[40%]">Bình luận</th>
                                <th className="px-6 py-4">Bài viết</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y relative">
                            {data?.comments?.map((comment: BlogComment) => (
                                <tr key={comment.id} className={`transition-colors hover:bg-secondary/10 ${comment.status === 'HIDDEN' || comment.deletedAt ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold">{comment.user ? comment.user.fullName : comment.guestName || AnonymousName}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-medium line-clamp-3">{comment.content}</p>
                                        {comment.deletedAt && <span className="text-[10px] bg-destructive/10 text-destructive font-bold px-1.5 py-0.5 rounded mt-1 inline-block">ĐÃ XÓA MỀM</span>}
                                        {comment.status === 'HIDDEN' && !comment.deletedAt && <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">BỊ ẨN</span>}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        {comment.post ? (
                                            <a href={`/blog/${comment.post.slug}`} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline line-clamp-2">
                                                {comment.post.title}
                                            </a>
                                        ) : <span className="text-xs italic text-muted-foreground">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right align-top">
                                        {!comment.deletedAt && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleHide(comment)}
                                                    className={`p-1.5 rounded-lg transition-colors ${comment.status === 'VISIBLE' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                                                    title={comment.status === 'VISIBLE' ? 'Ẩn bình luận' : 'Hiển thị lại'}
                                                >
                                                    {comment.status === 'VISIBLE' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comment)}
                                                    className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                                                    title="Xóa vĩnh viễn"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {data?.comments?.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-bold">
                                        Không có bình luận nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t bg-background flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shrink-0">
                    <div>
                        {!isLoading && data?.pagination && data.pagination.totalPages > 1 ? (
                            <div className="flex items-center gap-3">
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:bg-secondary/70">
                                    Trang trước
                                </button>
                                <span className="text-sm font-bold">{page} / {data.pagination.totalPages}</span>
                                <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-secondary rounded-xl font-bold disabled:opacity-50 text-sm hover:bg-secondary/70">
                                    Trang sau
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {showCloseButton && onClose ? (
                        <div className="lg:ml-auto">
                            <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold border hover:bg-secondary transition-colors">Đóng lại</button>
                        </div>
                    ) : null}
                </div>
            </div>
            <AdminActionDialog
                isOpen={!!commentToDelete}
                title="Xóa vĩnh viễn bình luận"
                description={commentToDelete ? `Bình luận của ${commentToDelete.user ? commentToDelete.user.fullName : commentToDelete.guestName || AnonymousName} sẽ bị xóa và không thể khôi phục.` : 'Bình luận sẽ bị xóa vĩnh viễn.'}
                confirmText="Xóa bình luận"
                tone="destructive"
                isPending={deleteMutation.isPending}
                onClose={() => setCommentToDelete(null)}
                onConfirm={() => {
                    if (!commentToDelete) return;
                    deleteMutation.mutate(commentToDelete.id);
                }}
            />
        </>
    );
};

export const AdminBlogCommentsModal: React.FC<AdminBlogCommentsModalProps> = ({
    isOpen,
    onClose,
    postId,
    initialSearch,
    embedded = false,
    title,
    description,
    showCloseButton = true,
}) => {
    if (!isOpen) return null;

    const content = (
        <AdminBlogCommentsManager
            postId={postId}
            initialSearch={initialSearch}
            embedded={embedded}
            title={title}
            description={description}
            onClose={onClose}
            showCloseButton={showCloseButton}
        />
    );

    if (embedded) {
        return content;
    }

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            {content}
        </div>,
        document.body,
    );
};
