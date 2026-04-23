import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Eye, Search, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button, buttonVariants } from '../components/ui/Button';
import { blogApi } from '../lib/blogApi';
import { blogQueryKeys } from '../lib/blogQueryKeys';
import { toApiAssetUrl } from '../lib/authApi';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';

const formatDate = (value: string | null) => {
    if (!value) return 'Chưa xuất bản';
    return new Date(value).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

function BlogCard({
    post,
    variant = 'default',
}: {
    post: Awaited<ReturnType<typeof blogApi.listPublished>>['posts'][number];
    variant?: 'default' | 'featured';
}) {
    const isFeatured = variant === 'featured';

    return (
        <Link
            to={`/blog/${post.slug}`}
            className={cn(
                'group block overflow-hidden rounded-[28px] border border-border/60 bg-background transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10',
                isFeatured ? 'lg:grid lg:grid-cols-[1.2fr_0.8fr]' : 'h-full',
            )}
        >
            <div className={cn('relative overflow-hidden bg-surface', isFeatured ? 'min-h-[320px]' : 'aspect-[16/10]')}>
                {post.coverImageUrl ? (
                    <img
                        src={toApiAssetUrl(post.coverImageUrl) ?? ''}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 text-primary/60">
                        <BookOpen size={isFeatured ? 52 : 34} />
                    </div>
                )}
                {post.tag && (
                    <div className="absolute left-4 top-4">
                        <Badge variant="secondary" className="border border-background/70 bg-background/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
                            {post.tag}
                        </Badge>
                    </div>
                )}
            </div>

            <div className={cn('flex flex-col', isFeatured ? 'justify-between p-7 sm:p-8' : 'p-5')}>
                <div>
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <span>{formatDate(post.publishedAt)}</span>
                        {post.readTimeText && (
                            <>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span>{post.readTimeText}</span>
                            </>
                        )}
                    </div>

                    <h2
                        className={cn(
                            'font-semibold text-foreground transition-colors group-hover:text-primary',
                            isFeatured ? 'text-2xl sm:text-[2rem] sm:leading-tight' : 'text-xl leading-tight line-clamp-2',
                        )}
                    >
                        {post.title}
                    </h2>

                    {post.excerpt && (
                        <p
                            className={cn(
                                'mt-3 text-muted-foreground',
                                isFeatured ? 'text-base leading-7' : 'line-clamp-3 text-sm leading-6',
                            )}
                        >
                            {post.excerpt}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar alt={post.author?.fullName ?? 'Tác giả'} size="sm" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                                {post.author?.fullName ?? 'IT Compass'}
                            </p>
                            <p className="text-xs text-muted-foreground">Biên tập nội dung</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye size={14} />
                        <span>{post.views.toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function BlogSkeletonGrid() {
    return (
        <div className="space-y-8">
            <div className="overflow-hidden rounded-[28px] border border-border/60 bg-background lg:grid lg:grid-cols-[1.2fr_0.8fr]">
                <Skeleton className="min-h-[320px] w-full rounded-none" />
                <div className="space-y-4 p-7 sm:p-8">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-5/6" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-10 h-12 w-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="overflow-hidden rounded-[28px] border border-border/60 bg-background">
                        <Skeleton className="aspect-[16/10] w-full rounded-none" />
                        <div className="space-y-4 p-5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-7 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-2/3" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BlogPage() {
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState<string>('all');

    const { data, isLoading, error } = useQuery({
        queryKey: blogQueryKeys.published,
        queryFn: () => blogApi.listPublished(),
    });

    const posts = data?.posts ?? [];

    const tags = useMemo(
        () => posts.map((post) => post.tag).filter((tag): tag is string => Boolean(tag)).filter((tag, index, arr) => arr.indexOf(tag) === index),
        [posts],
    );

    const filteredPosts = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        return posts.filter((post) => {
            const matchesTag = activeTag === 'all' || post.tag === activeTag;
            const haystack = [post.title, post.excerpt, post.author?.fullName, post.tag]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
            return matchesTag && matchesSearch;
        });
    }, [activeTag, posts, search]);

    const featuredPost = useMemo(
        () => filteredPosts.find((post) => post.isFeatured) ?? filteredPosts[0] ?? null,
        [filteredPosts],
    );

    const remainingPosts = useMemo(
        () => filteredPosts.filter((post) => post.id !== featuredPost?.id),
        [featuredPost?.id, filteredPosts],
    );

    return (
        <>
            <Helmet>
                <title>Blog IT Compass — Kiến thức, kinh nghiệm và định hướng CNTT</title>
                <meta
                    name="description"
                    content="Khám phá bài viết định hướng nghề nghiệp CNTT, kinh nghiệm học tập, thực tập và góc nhìn thực chiến từ IT Compass."
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_24%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] px-6 py-10 sm:px-10 sm:py-14">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                    <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="max-w-3xl"
                        >
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur">
                                <Sparkles size={14} /> Góc nhìn IT Compass
                            </div>
                            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.05]">
                                Blog dành cho người đang tìm đường đi trong ngành CNTT.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                Từ lựa chọn ngành học, hành trình tự học đến trải nghiệm thực chiến — đây là nơi bạn đọc nhanh, hiểu sâu và hành động rõ ràng hơn cho lộ trình IT của mình.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.08 }}
                            className="rounded-[28px] border border-border/70 bg-background/85 p-4 shadow-xl shadow-primary/5 backdrop-blur"
                        >
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm theo tiêu đề, tag hoặc tác giả"
                                icon={<Search size={16} />}
                                className="h-11 rounded-xl"
                            />
                            <p className="mt-3 text-sm text-muted-foreground">
                                {filteredPosts.length.toLocaleString('vi-VN')} bài viết phù hợp với bộ lọc hiện tại.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="mt-8">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={activeTag === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTag('all')}
                        >
                            Tất cả
                        </Button>
                        {tags.map((tag) => (
                            <Button
                                key={tag}
                                variant={activeTag === tag ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveTag(tag)}
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </section>

                <section className="mt-10">
                    {isLoading ? (
                        <BlogSkeletonGrid />
                    ) : error ? (
                        <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-12">
                            <EmptyState
                                icon={<BookOpen size={28} />}
                                title="Không thể tải bài viết lúc này"
                                description={getErrorMessage(error, 'Đã có lỗi khi tải danh sách bài viết.')}
                                action={
                                    <Link to="/" className={buttonVariants({ variant: 'outline' })}>
                                        Về trang chủ
                                    </Link>
                                }
                            />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="rounded-[28px] border border-border/60 bg-surface/40 px-6 py-12">
                            <EmptyState
                                icon={<Search size={28} />}
                                title="Không tìm thấy bài viết phù hợp"
                                description="Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc tag để xem thêm nội dung."
                                action={
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setActiveTag('all');
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {featuredPost && (
                                <motion.section
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45 }}
                                >
                                    <BlogCard post={featuredPost} variant="featured" />
                                </motion.section>
                            )}

                            {remainingPosts.length > 0 && (
                                <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {remainingPosts.map((post, index) => (
                                        <motion.article
                                            key={post.id}
                                            initial={{ opacity: 0, y: 24 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.24) }}
                                        >
                                            <BlogCard post={post} />
                                        </motion.article>
                                    ))}
                                </section>
                            )}
                        </div>
                    )}
                </section>

                <section className="mt-14 rounded-[28px] border border-border/60 bg-surface/50 px-6 py-8 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Đi tiếp sau khi đọc</p>
                            <h2 className="mt-2 text-2xl font-bold text-foreground">Muốn biết mình hợp với hướng đi nào?</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Làm bài trắc nghiệm Holland để xem ngành học, vị trí công việc và mentor nào phù hợp nhất với bạn.
                            </p>
                        </div>
                        <Link to="/test" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 self-start sm:self-auto')}>
                            Làm bài trắc nghiệm <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
}
