import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    BookOpen,
    Eye,
    MessageCircle,
    SendHorizonal,
    Sparkles,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, buttonVariants } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { BlogContentRenderer } from '../components/blog/BlogContentRenderer';
import { blogApi } from '../lib/blogApi';
import { blogQueryKeys } from '../lib/blogQueryKeys';
import { toApiAssetUrl } from '../lib/authApi';
import { getErrorMessage } from '../lib/appError';
import { useAuth } from '../contexts/AuthContext';

const formatDate = (value: string | null) => {
    if (!value) return 'Chưa xuất bản';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

function PostSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-6 w-28" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-5/6" />
            </div>
            <Skeleton className="aspect-[21/9] w-full rounded-[28px]" />
            <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
            </div>
        </div>
    );
}

export default function BlogDetailPage() {
    const { slug = '' } = useParams();
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuth();
    const [content, setContent] = useState('');
    const [guestName, setGuestName] = useState('');

    const postQuery = useQuery({
        queryKey: blogQueryKeys.detail(slug),
        queryFn: () => blogApi.getBySlug(slug),
        enabled: Boolean(slug),
    });

    const commentsQuery = useQuery({
        queryKey: blogQueryKeys.comments(slug),
        queryFn: () => blogApi.listComments(slug),
        enabled: Boolean(slug),
    });

    const post = postQuery.data?.post ?? null;
    const comments = commentsQuery.data?.comments ?? [];

    const seoDescription = useMemo(
        () => post?.metaDescription || post?.excerpt || 'Bài viết chia sẻ kiến thức, kinh nghiệm và góc nhìn thực chiến từ IT Compass.',
        [post?.excerpt, post?.metaDescription],
    );

    const createCommentMutation = useMutation({
        mutationFn: (input: { content: string; guestName?: string }) => blogApi.createComment(slug, input),
        onSuccess: async () => {
            setContent('');
            if (!isAuthenticated) {
                setGuestName('');
            }
            await queryClient.invalidateQueries({ queryKey: blogQueryKeys.comments(slug) });
            toast.success('Bình luận của bạn đã được gửi.');
        },
    });

    const handleSubmitComment = (event: { preventDefault: () => void }) => {
        event.preventDefault();

        const normalizedContent = content.trim();
        const normalizedGuestName = guestName.trim();

        if (!normalizedContent) {
            toast.error('Vui lòng nhập nội dung bình luận.');
            return;
        }

        if (!isAuthenticated && !normalizedGuestName) {
            toast.error('Vui lòng nhập tên hiển thị trước khi gửi bình luận.');
            return;
        }

        createCommentMutation.mutate({
            content: normalizedContent,
            ...(isAuthenticated ? {} : { guestName: normalizedGuestName }),
        });
    };

    const isLoading = postQuery.isLoading;
    const hasPostError = postQuery.error || !slug;

    return (
        <>
            <Helmet>
                <title>{post ? `${post.title} — Blog IT Compass` : 'Bài viết — Blog IT Compass'}</title>
                <meta name="description" content={seoDescription} />
                {post?.metaTitle && <meta property="og:title" content={post.metaTitle} />}
                {post?.ogImageUrl && <meta property="og:image" content={toApiAssetUrl(post.ogImageUrl) ?? post.ogImageUrl} />}
            </Helmet>

            <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                {isLoading ? (
                    <PostSkeleton />
                ) : hasPostError || !post ? (
                    <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-14">
                        <EmptyState
                            icon={<BookOpen size={30} />}
                            title="Không thể tải bài viết"
                            description={getErrorMessage(postQuery.error, 'Bài viết này không tồn tại hoặc đã bị gỡ xuống.')}
                            action={
                                <Link to="/blog" className={buttonVariants({ variant: 'outline' })}>
                                    Quay lại danh sách blog
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                        <article>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45 }}
                            >
                                <Link
                                    to="/blog"
                                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <ArrowLeft size={16} /> Quay lại blog
                                </Link>

                                <div className="mt-6 rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] p-6 sm:p-8 lg:p-10">
                                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        {post.tag && (
                                            <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-primary">
                                                {post.tag}
                                            </Badge>
                                        )}
                                        <span>{formatDate(post.publishedAt)}</span>
                                        {post.readTimeText && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span>{post.readTimeText}</span>
                                            </>
                                        )}
                                    </div>

                                    <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.06]">
                                        {post.title}
                                    </h1>

                                    {(post.excerpt || post.metaDescription) && (
                                        <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                                            {post.excerpt || post.metaDescription}
                                        </p>
                                    )}

                                    <div className="mt-8 flex flex-col gap-4 rounded-[24px] border border-border/60 bg-background/80 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar alt={post.author?.fullName ?? 'Tác giả'} size="md" />
                                            <div>
                                                <p className="font-medium text-foreground">{post.author?.fullName ?? 'IT Compass'}</p>
                                                <p className="text-sm text-muted-foreground">Biên tập nội dung</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                            <div className="inline-flex items-center gap-1.5">
                                                <Eye size={15} /> {post.views.toLocaleString('vi-VN')} lượt xem
                                            </div>
                                            <div className="inline-flex items-center gap-1.5">
                                                <MessageCircle size={15} /> {comments.length.toLocaleString('vi-VN')} bình luận
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.08 }}
                                className="mt-8"
                            >
                                <div className="overflow-hidden rounded-[32px] border border-border/60 bg-background">
                                    {post.coverImageUrl ? (
                                        <img
                                            src={toApiAssetUrl(post.coverImageUrl) ?? ''}
                                            alt={post.title}
                                            className="aspect-[21/9] w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex aspect-[21/9] items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 text-primary/60">
                                            <BookOpen size={54} />
                                        </div>
                                    )}
                                    <div className="px-6 py-8 sm:px-8 sm:py-10">
                                        <BlogContentRenderer content={post.content} />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.12 }}
                                className="mt-10"
                            >
                                <div className="rounded-[32px] border border-border/60 bg-surface/40 p-6 sm:p-8">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Bình luận</p>
                                            <h2 className="mt-1 text-2xl font-bold text-foreground">
                                                Trao đổi về bài viết này
                                            </h2>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmitComment} className="mt-6 space-y-4 rounded-[24px] border border-border/60 bg-background p-5 sm:p-6">
                                        {!isAuthenticated && (
                                            <div>
                                                <label htmlFor="guestName" className="text-sm font-medium text-foreground">
                                                    Tên hiển thị
                                                </label>
                                                <input
                                                    id="guestName"
                                                    value={guestName}
                                                    onChange={(event) => setGuestName(event.target.value)}
                                                    placeholder="Nhập tên của bạn"
                                                    className="mt-2 flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label htmlFor="commentContent" className="text-sm font-medium text-foreground">
                                                Nội dung bình luận
                                            </label>
                                            <textarea
                                                id="commentContent"
                                                value={content}
                                                onChange={(event) => setContent(event.target.value)}
                                                placeholder="Chia sẻ suy nghĩ, câu hỏi hoặc góc nhìn của bạn về bài viết này"
                                                rows={5}
                                                className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                {isAuthenticated
                                                    ? `Đăng bình luận với tên ${user?.fullName ?? 'tài khoản của bạn'}.`
                                                    : 'Bạn có thể bình luận ngay cả khi chưa đăng nhập.'}
                                            </p>
                                            <Button type="submit" size="lg" isLoading={createCommentMutation.isPending} className="gap-2 self-start sm:self-auto">
                                                Gửi bình luận <SendHorizonal size={16} />
                                            </Button>
                                        </div>
                                    </form>

                                    <div className="mt-8 space-y-4">
                                        {commentsQuery.isLoading ? (
                                            Array.from({ length: 3 }).map((_, index) => (
                                                <div key={index} className="rounded-[24px] border border-border/60 bg-background p-5">
                                                    <div className="flex items-start gap-3">
                                                        <Skeleton className="h-10 w-10 rounded-full" />
                                                        <div className="min-w-0 flex-1 space-y-3">
                                                            <Skeleton className="h-4 w-40" />
                                                            <Skeleton className="h-4 w-full" />
                                                            <Skeleton className="h-4 w-3/4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : commentsQuery.error ? (
                                            <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                                                {getErrorMessage(commentsQuery.error, 'Không thể tải bình luận lúc này.')}
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div className="rounded-[24px] border border-border/60 bg-background p-6">
                                                <EmptyState
                                                    icon={<MessageCircle size={24} />}
                                                    title="Chưa có bình luận nào"
                                                    description="Hãy là người đầu tiên bắt đầu cuộc trao đổi dưới bài viết này."
                                                />
                                            </div>
                                        ) : (
                                            comments.map((comment, index) => (
                                                <motion.div
                                                    key={comment.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.16) }}
                                                    className="rounded-[24px] border border-border/60 bg-background p-5"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Avatar alt={comment.user?.fullName ?? comment.guestName ?? 'Khách'} size="sm" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="font-medium text-foreground">
                                                                        {comment.user?.fullName ?? comment.guestName ?? 'Khách'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                                                                </div>
                                                                <Badge variant="outline" className="w-fit border-border/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                                                    {comment.user ? 'Tài khoản' : 'Khách'}
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.section>
                        </article>

                        <aside className="space-y-6 xl:sticky xl:top-24">
                            <motion.div
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.45, delay: 0.08 }}
                                className="rounded-[28px] border border-border/60 bg-surface/50 p-6"
                            >
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Tóm tắt nhanh</p>
                                <dl className="mt-5 space-y-4 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">Ngày đăng</dt>
                                        <dd className="mt-1 font-medium text-foreground">{formatDate(post.publishedAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Tác giả</dt>
                                        <dd className="mt-1 font-medium text-foreground">{post.author?.fullName ?? 'IT Compass'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Thời gian đọc</dt>
                                        <dd className="mt-1 font-medium text-foreground">{post.readTimeText ?? 'Đang cập nhật'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Lượt xem</dt>
                                        <dd className="mt-1 font-medium text-foreground">{post.views.toLocaleString('vi-VN')}</dd>
                                    </div>
                                </dl>
                            </motion.div>


                        </aside>
                    </div>
                )}
            </main>
        </>
    );
}
