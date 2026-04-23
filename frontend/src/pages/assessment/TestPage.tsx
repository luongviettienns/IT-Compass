import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    ArrowRight,
    Brain,
    Clock3,
    Compass,
    Sparkles,
    Target,
    UserRound,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Badge } from '../../components/ui/Badge';
import { buttonVariants } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../lib/appError';
import { assessmentApi } from '../../lib/assessmentApi';
import { assessmentQueryKeys } from '../../lib/assessmentQueryKeys';
import { cn } from '../../lib/utils';
import { HOLLAND_TRAIT_MAP } from '../../lib/constants/holland';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return 'Chưa có dữ liệu';
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

function HeroSkeleton() {
    return (
        <div className="space-y-8">
            <div className="rounded-[32px] border border-border/60 bg-background p-8 sm:p-10">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-14 w-full max-w-3xl" />
                    <Skeleton className="h-6 w-full max-w-2xl" />
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Skeleton className="h-11 w-40 rounded-full" />
                        <Skeleton className="h-11 w-40 rounded-full" />
                        <Skeleton className="h-11 w-40 rounded-full" />
                    </div>
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-40 rounded-[28px]" />
                ))}
            </div>
        </div>
    );
}

export default function TestPage() {
    const { isAuthenticated } = useAuth();

    const templateQuery = useQuery({
        queryKey: assessmentQueryKeys.currentTemplate,
        queryFn: () => assessmentApi.getCurrentTemplate(),
    });

    const latestAttemptQuery = useQuery({
        queryKey: assessmentQueryKeys.latestAttempt,
        queryFn: () => assessmentApi.getLatestAttempt(),
        enabled: isAuthenticated,
    });

    const template = templateQuery.data?.template ?? null;
    const latestAttempt = latestAttemptQuery.data?.attempt ?? null;
    const topRecommendation = latestAttempt?.summary.ranking?.[0] ?? null;

    return (
        <>
            <Helmet>
                <title>Bài trắc nghiệm định hướng IT — IT Compass</title>
                <meta
                    name="description"
                    content="Làm bài trắc nghiệm định hướng CNTT để khám phá nhóm nghề phù hợp, xem gợi ý chuyên ngành và chuẩn bị lộ trình mentor sát với hồ sơ của bạn."
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                {templateQuery.isLoading ? (
                    <HeroSkeleton />
                ) : templateQuery.error || !template ? (
                    <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-14">
                        <EmptyState
                            icon={<Brain size={28} />}
                            title="Không thể tải bài trắc nghiệm"
                            description={getErrorMessage(templateQuery.error, 'Hiện chưa thể tải bộ câu hỏi đánh giá. Vui lòng thử lại sau.')}
                            action={
                                <Link to="/" className={buttonVariants({ variant: 'outline' })}>
                                    Quay lại trang chủ
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-10">
                        <section className="relative overflow-hidden rounded-[36px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.18),transparent_26%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] px-6 py-10 sm:px-10 sm:py-14">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45 }}
                                >
                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur">
                                        <Sparkles size={14} /> Trắc nghiệm khám phá
                                    </div>
                                    <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.04]">
                                        Chọn hướng IT bằng dữ liệu cá nhân, thay vì đoán cảm tính.
                                    </h1>
                                    <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                        Bài trắc nghiệm này kết hợp câu hỏi Holland và tình huống mô phỏng để xác định nhóm nghề phù hợp,
                                        gợi ý chuyên ngành liên quan và tạo nền cho mentor recommendation sát với hồ sơ của bạn.
                                    </p>

                                    <div className="mt-7 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-4 py-2 backdrop-blur">
                                            <Clock3 size={15} className="text-primary" /> {template.estimatedMinutes} phút tập trung
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-4 py-2 backdrop-blur">
                                            <Target size={15} className="text-primary" /> {template.questionCount} câu hỏi có chấm điểm
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-4 py-2 backdrop-blur">
                                            <Compass size={15} className="text-primary" /> {template.resultProfiles.length} nhóm kết quả nghề nghiệp
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                        <Link to="/test/quiz" className={cn(buttonVariants({ size: 'xl' }), 'justify-center sm:min-w-[220px]')}>
                                            Bắt đầu làm bài <ArrowRight size={18} />
                                        </Link>
                                        {latestAttempt && (
                                            <Link
                                                to="/test/result"
                                                className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'justify-center sm:min-w-[220px]')}
                                            >
                                                Xem kết quả gần nhất
                                            </Link>
                                        )}
                                    </div>


                                </motion.div>

                                <motion.aside
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.55, delay: 0.08 }}
                                    className="rounded-[30px] border border-border/70 bg-background/85 p-6 shadow-xl shadow-primary/5 backdrop-blur"
                                >
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Phiên gần nhất</p>
                                    {isAuthenticated ? (
                                        latestAttemptQuery.isLoading ? (
                                            <div className="mt-5 space-y-3">
                                                <Skeleton className="h-6 w-36" />
                                                <Skeleton className="h-10 w-full" />
                                                <Skeleton className="h-4 w-5/6" />
                                                <Skeleton className="h-24 w-full rounded-[24px]" />
                                            </div>
                                        ) : latestAttemptQuery.error ? (
                                            <div className="mt-5 rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                                                {getErrorMessage(latestAttemptQuery.error, 'Không thể tải kết quả assessment gần nhất.')}
                                            </div>
                                        ) : latestAttempt ? (
                                            <div className="mt-5 space-y-4">
                                                <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                                                    {latestAttempt.resultCode}
                                                </Badge>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-foreground">{latestAttempt.summary.title}</h2>
                                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{latestAttempt.summary.headline}</p>
                                                </div>
                                                <div className="rounded-[24px] border border-border/60 bg-surface/45 p-4 text-sm">
                                                    <p className="text-muted-foreground">Hoàn tất lúc</p>
                                                    <p className="mt-1 font-medium text-foreground">{formatDateTime(latestAttempt.submittedAt)}</p>
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {latestAttempt.summary.topTraits.slice(0, 3).map((trait) => (
                                                            <Badge key={trait} variant="outline" className="border-border/70 bg-background px-3 py-1 text-xs text-foreground/80">
                                                                {trait} - {HOLLAND_TRAIT_MAP[trait] || trait}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                {topRecommendation && (
                                                    <div className="rounded-[24px] border border-primary/15 bg-primary/10 p-4 text-sm">
                                                        <p className="font-semibold text-primary">Gợi ý nổi bật</p>
                                                        <p className="mt-2 font-medium text-foreground">{topRecommendation.title}</p>
                                                        <p className="mt-1 leading-6 text-muted-foreground">{topRecommendation.headline}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-5 rounded-[24px] border border-border/60 bg-surface/45 p-5 text-sm text-muted-foreground">
                                                Chưa có kết quả nào được lưu. Sau lần làm đầu tiên, bạn sẽ thấy bản tóm tắt và các gợi ý tiếp theo ở đây.
                                            </div>
                                        )
                                    ) : (
                                        <div className="mt-5 rounded-[24px] border border-border/60 bg-surface/45 p-5 text-sm text-muted-foreground flex flex-col gap-3">
                                            <p>Vui lòng đăng nhập để lưu giữ lịch sử làm bài và nhận gợi ý phù hợp.</p>
                                            <Link to="/auth/login" className="text-primary hover:underline font-semibold">Đăng nhập ngay →</Link>
                                        </div>
                                    )}
                                </motion.aside>
                            </div>
                        </section>

                        <section className="grid gap-6 lg:grid-cols-3">
                            {[
                                {
                                    icon: <Brain size={20} />,
                                    title: 'Nhóm động lực Holland',
                                    description: 'Bạn sẽ tự đánh giá mức độ hứng thú với từng loại công việc để lộ ra thiên hướng nổi trội.',
                                },
                                {
                                    icon: <Compass size={20} />,
                                    title: 'Tình huống sát thực tế',
                                    description: 'Phần situational kiểm tra cách bạn ưu tiên hành động trong bối cảnh học tập và công việc IT.',
                                },
                                {
                                    icon: <UserRound size={20} />,
                                    title: 'Kết nối bước tiếp theo',
                                    description: 'Kết quả cuối sẽ dẫn sang chuyên ngành, mentor và các hướng phát triển tương ứng.',
                                },
                            ].map((item, index) => (
                                <motion.article
                                    key={item.title}
                                    initial={{ opacity: 0, y: 22 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.05 * index }}
                                    className="rounded-[28px] border border-border/60 bg-background p-6"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        {item.icon}
                                    </div>
                                    <h2 className="mt-5 text-xl font-bold text-foreground">{item.title}</h2>
                                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
                                </motion.article>
                            ))}
                        </section>
                    </div>
                )}
            </main>
        </>
    );
}
