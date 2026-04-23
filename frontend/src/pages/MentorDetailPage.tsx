import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    BadgeCheck,
    Briefcase,
    Building2,
    Clock3,
    Globe2,
    GraduationCap,
    Languages,
    ReceiptText,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { buttonVariants } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

function DetailSkeleton() {
    return (
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-8">
                <div className="rounded-[32px] border border-border/60 bg-background p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <Skeleton className="h-28 w-28 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-72" />
                            <Skeleton className="h-5 w-96" />
                        </div>
                    </div>
                </div>
                <Skeleton className="h-64 rounded-[32px]" />
                <Skeleton className="h-56 rounded-[32px]" />
            </div>
            <Skeleton className="h-[420px] rounded-[32px]" />
        </div>
    );
}

export default function MentorDetailPage() {
    const { slug = '' } = useParams();
    const { isAuthenticated } = useAuth();

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.detail(slug),
        queryFn: () => mentorApi.getBySlug(slug),
        enabled: Boolean(slug),
    });

    const mentor = data?.mentor ?? null;
    const ctaLabel = isAuthenticated ? 'Tiếp tục với hồ sơ của bạn' : 'Đăng nhập để kết nối sau';
    const ctaHref = isAuthenticated ? '/profile' : `/auth/login?redirect=/mentors/${slug}`;

    return (
        <>
            <Helmet>
                <title>{mentor ? `${mentor.name} — Mentor IT Compass` : 'Chi tiết mentor — IT Compass'}</title>
                <meta
                    name="description"
                    content={mentor?.bio || 'Khám phá chi tiết mentor, chuyên môn, kinh nghiệm và cách họ có thể đồng hành cùng hành trình IT của bạn.'}
                />
            </Helmet>

            <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                {isLoading ? (
                    <DetailSkeleton />
                ) : error || !mentor ? (
                    <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-14">
                        <EmptyState
                            icon={<UserRound size={28} />}
                            title="Không thể tải hồ sơ mentor"
                            description={getErrorMessage(error, 'Mentor này không tồn tại hoặc hiện không còn khả dụng.')}
                            action={
                                <Link to="/mentors" className={buttonVariants({ variant: 'outline' })}>
                                    Quay lại danh sách mentor
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                        <article className="space-y-8">
                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45 }}
                                className="relative overflow-hidden rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_24%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] p-6 sm:p-8 lg:p-10"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                        <Avatar src={mentor.avatarUrl} alt={mentor.name} size="xl" className="ring-4 ring-primary/10" />
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {mentor.level && (
                                                    <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                                        {mentor.level}
                                                    </Badge>
                                                )}
                                                {mentor.isVerified && (
                                                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
                                                        <BadgeCheck size={14} /> Đã xác minh
                                                    </div>
                                                )}
                                            </div>
                                            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.05]">
                                                {mentor.name}
                                            </h1>
                                            <p className="mt-3 max-w-2xl text-lg leading-7 text-muted-foreground">
                                                {getMentorHeadline(mentor)}
                                            </p>
                                            {mentor.expertiseArea && (
                                                <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground backdrop-blur">
                                                    <Sparkles size={15} className="text-primary" /> {mentor.expertiseArea}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.08 }}
                                className="rounded-[32px] border border-border/60 bg-background p-6 sm:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ReceiptText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Giới thiệu</p>
                                        <h2 className="mt-1 text-2xl font-bold text-foreground">Mentor này có thể giúp gì cho bạn?</h2>
                                    </div>
                                </div>
                                <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-foreground/90">
                                    {mentor.bio || 'Mentor chưa cập nhật phần giới thiệu chi tiết.'}
                                </p>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.14 }}
                                className="grid gap-6 lg:grid-cols-[1fr_1fr]"
                            >
                                <div className="rounded-[32px] border border-border/60 bg-surface/45 p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-foreground">Chuyên môn nổi bật</h2>
                                    <div className="mt-5 flex flex-wrap gap-2.5">
                                        {mentor.expertise.length > 0 ? (
                                            mentor.expertise.map((item) => (
                                                <Badge key={item} variant="outline" className="border-border/70 bg-background px-3 py-1.5 text-sm text-foreground/85">
                                                    {item}
                                                </Badge>
                                            ))
                                        ) : (
                                            <Badge variant="outline" className="border-border/70 bg-background px-3 py-1.5 text-sm text-foreground/85">
                                                {mentor.expertiseArea || 'Đang cập nhật'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[32px] border border-border/60 bg-surface/45 p-6 sm:p-8">
                                    <h2 className="text-xl font-bold text-foreground">Bối cảnh hiện tại</h2>
                                    <div className="mt-5 space-y-4 text-sm">
                                        <div className="flex items-start gap-3">
                                            <Building2 size={18} className="mt-0.5 text-primary" />
                                            <div>
                                                <p className="text-muted-foreground">Công ty hiện tại</p>
                                                <p className="mt-1 font-medium text-foreground">{mentor.currentCompany || 'Đang cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Briefcase size={18} className="mt-0.5 text-primary" />
                                            <div>
                                                <p className="text-muted-foreground">Job title</p>
                                                <p className="mt-1 font-medium text-foreground">{mentor.currentJobTitle || mentor.title || 'Đang cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <GraduationCap size={18} className="mt-0.5 text-primary" />
                                            <div>
                                                <p className="text-muted-foreground">Trường học</p>
                                                <p className="mt-1 font-medium text-foreground">{mentor.currentSchool || 'Không công khai'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        </article>

                        <motion.aside
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.45, delay: 0.1 }}
                            className="space-y-6 xl:sticky xl:top-24"
                        >
                            <div className="rounded-[32px] border border-border/60 bg-background p-6 shadow-xl shadow-primary/5">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Thông tin nhanh</p>
                                <div className="mt-5 space-y-4 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Clock3 size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Kinh nghiệm</p>
                                            <p className="mt-1 font-medium text-foreground">
                                                {mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : 'Đang cập nhật'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <ReceiptText size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Chi phí tham khảo</p>
                                            <p className="mt-1 font-medium text-foreground">{formatMentorHourlyRate(mentor.hourlyRate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Languages size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Ngôn ngữ tư vấn</p>
                                            <p className="mt-1 font-medium text-foreground">{mentor.consultationLang || 'Việt / English'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe2 size={18} className="mt-0.5 text-primary" />
                                        <div>
                                            <p className="text-muted-foreground">Độ tin cậy</p>
                                            <p className="mt-1 font-medium text-foreground">{mentor.reviewCount.toLocaleString('vi-VN')} đánh giá</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <Link to={ctaHref} className={cn(buttonVariants({ size: 'lg' }), 'justify-center')}>
                                        {ctaLabel}
                                    </Link>
                                    <Link to="/test" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'justify-center')}>
                                        Làm trắc nghiệm trước
                                    </Link>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </main>
        </>
    );
}
