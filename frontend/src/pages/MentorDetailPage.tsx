import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'motion/react';
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Building2,
    CalendarCheck2,
    Clock3,
    Globe2,
    GraduationCap,
    Languages,
    MessageCircle,
    ReceiptText,
    Sparkles,
    Star,
    UserRound,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, buttonVariants } from '../components/ui/Button';
import { BookingDialog } from '../components/mentor/BookingDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

/* ────────────────────────────────────────────────────────
 * Animated number counter for stat highlights
 * ──────────────────────────────────────────────────────── */
function AnimatedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    useEffect(() => {
        if (!isInView) return;
        let raf: number;
        const start = performance.now();
        const duration = 1200;
        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setDisplay(Math.round(eased * value));
            if (progress < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [isInView, value]);

    return (
        <span ref={ref} className="tabular-nums">
            {display.toLocaleString('vi-VN')}{suffix}
        </span>
    );
}

/* ────────────────────────────────────────────────────────
 * Skeleton while loading
 * ──────────────────────────────────────────────────────── */
function DetailSkeleton() {
    return (
        <div className="space-y-8">
            {/* hero skeleton */}
            <div className="relative overflow-hidden rounded-[36px] border border-border/50">
                <div className="px-6 py-12 sm:px-10 sm:py-16">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-12 w-80" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                </div>
            </div>
            {/* stat bar skeleton */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-[24px]" />
                ))}
            </div>
            {/* content skeleton */}
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <div className="space-y-8">
                    <Skeleton className="h-64 rounded-[28px]" />
                    <Skeleton className="h-48 rounded-[28px]" />
                </div>
                <Skeleton className="h-80 rounded-[28px]" />
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────
 * Animation presets
 * ──────────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 28 } as const,
    animate: { opacity: 1, y: 0 } as const,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] } as const,
});

const fadeScale = (delay = 0) => ({
    initial: { opacity: 0, scale: 0.92 } as const,
    animate: { opacity: 1, scale: 1 } as const,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } as const,
});

/* ════════════════════════════════════════════════════════
 * MAIN PAGE
 * ════════════════════════════════════════════════════════ */
export default function MentorDetailPage() {
    const { slug = '' } = useParams();
    const { isAuthenticated, user } = useAuth();
    const [bookingOpen, setBookingOpen] = useState(false);
    const [showStickyCta, setShowStickyCta] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.detail(slug),
        queryFn: () => mentorApi.getBySlug(slug),
        enabled: Boolean(slug),
    });

    const mentor = data?.mentor ?? null;
    const canBookMentor = isAuthenticated && user?.role === 'STUDENT';

    /* Show sticky CTA after hero scrolls out of view */
    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyCta(!entry.isIntersecting),
            { threshold: 0.15 },
        );
        observer.observe(hero);
        return () => observer.disconnect();
    }, [mentor]);

    return (
        <>
            <Helmet>
                <title>{mentor ? `${mentor.name} — Mentor IT Compass` : 'Chi tiết mentor — IT Compass'}</title>
                <meta
                    name="description"
                    content={mentor?.bio || 'Khám phá chi tiết mentor, chuyên môn, kinh nghiệm và cách họ có thể đồng hành cùng hành trình IT của bạn.'}
                />
            </Helmet>

            <BookingDialog slug={slug} open={bookingOpen} onOpenChange={setBookingOpen} />

            <main className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
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
                    <div className="space-y-8">
                        {/* ══════════════════════════════════════════
                         * 1. CINEMATIC HERO
                         * ══════════════════════════════════════════ */}
                        <motion.section
                            ref={heroRef}
                            {...fadeUp()}
                            className="relative isolate overflow-hidden rounded-[36px] border border-border/50 bg-gradient-to-br from-white via-blue-50/60 to-cyan-50/40"
                        >
                            {/* Decorative mesh */}
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/15 blur-[100px]" />
                                <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-accent/15 blur-[90px]" />
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.035)_1px,transparent_1px)] bg-[size:32px_32px]" />
                            </div>

                            <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
                                {/* Breadcrumb */}
                                <motion.div {...fadeUp(0.1)} className="mb-8">
                                    <Link
                                        to="/mentors"
                                        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground backdrop-blur transition-colors hover:border-primary/30 hover:text-primary"
                                    >
                                        ← Tất cả mentor
                                    </Link>
                                </motion.div>

                                {/* Main hero content */}
                                <div className="flex flex-col items-center text-center">
                                    {/* Avatar */}
                                    <motion.div
                                        {...fadeScale(0.15)}
                                        className="relative"
                                    >
                                        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/25 via-accent/20 to-primary/10 blur-md" />
                                        <Avatar
                                            src={mentor.avatarUrl}
                                            alt={mentor.name}
                                            size="xl"
                                            className="relative h-32 w-32 ring-4 ring-white/80 sm:h-36 sm:w-36"
                                        />
                                        {mentor.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg">
                                                <BadgeCheck size={18} />
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Badges */}
                                    <motion.div {...fadeUp(0.2)} className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                        {mentor.level && (
                                            <Badge variant="secondary" className="border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                                                {mentor.level}
                                            </Badge>
                                        )}
                                        {mentor.isVerified && (
                                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                                <BadgeCheck size={14} /> Đã xác minh
                                            </div>
                                        )}
                                        {mentor.expertiseArea && (
                                            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-semibold text-accent-foreground">
                                                <Sparkles size={13} className="text-accent" /> {mentor.expertiseArea}
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Name */}
                                    <motion.h1
                                        {...fadeUp(0.25)}
                                        className="mt-5 max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]"
                                    >
                                        {mentor.name}
                                    </motion.h1>

                                    {/* Headline */}
                                    <motion.p
                                        {...fadeUp(0.3)}
                                        className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground sm:text-xl"
                                    >
                                        {getMentorHeadline(mentor)}
                                    </motion.p>

                                    {/* Hero CTA */}
                                    <motion.div {...fadeUp(0.38)} className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                        {canBookMentor ? (
                                            <Button
                                                size="lg"
                                                className="gap-2.5 rounded-2xl px-8 py-3 text-base font-bold shadow-xl shadow-primary/20"
                                                onClick={() => setBookingOpen(true)}
                                            >
                                                <CalendarCheck2 size={18} /> Đặt lịch tư vấn
                                            </Button>
                                        ) : !isAuthenticated ? (
                                            <Link
                                                to={`/auth/login?redirect=/mentors/${slug}`}
                                                className={cn(buttonVariants({ size: 'lg' }), 'gap-2.5 rounded-2xl px-8 py-3 text-base font-bold shadow-xl shadow-primary/20')}
                                            >
                                                Đăng nhập để đặt lịch
                                            </Link>
                                        ) : null}
                                        <Link
                                            to="/test"
                                            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'gap-2 rounded-2xl px-7 py-3')}
                                        >
                                            Làm trắc nghiệm trước <ArrowRight size={16} />
                                        </Link>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.section>

                        {/* ══════════════════════════════════════════
                         * 2. STAT HIGHLIGHTS BAR
                         * ══════════════════════════════════════════ */}
                        <motion.section
                            {...fadeUp(0.12)}
                            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                        >
                            {[
                                {
                                    icon: <Clock3 size={20} />,
                                    label: 'Kinh nghiệm',
                                    value: mentor.yearsOfExperience != null
                                        ? <><AnimatedValue value={mentor.yearsOfExperience} /> năm</>
                                        : 'Đang cập nhật',
                                    accent: 'from-blue-500/10 to-blue-600/5',
                                    iconBg: 'bg-blue-500/10 text-blue-600',
                                },
                                {
                                    icon: <ReceiptText size={20} />,
                                    label: 'Chi phí tham khảo',
                                    value: formatMentorHourlyRate(mentor.hourlyRate),
                                    accent: 'from-emerald-500/10 to-emerald-600/5',
                                    iconBg: 'bg-emerald-500/10 text-emerald-600',
                                },
                                {
                                    icon: <Star size={20} />,
                                    label: 'Độ tin cậy',
                                    value: <><AnimatedValue value={mentor.reviewCount} /> đánh giá</>,
                                    accent: 'from-amber-500/10 to-amber-600/5',
                                    iconBg: 'bg-amber-500/10 text-amber-600',
                                },
                                {
                                    icon: <Languages size={20} />,
                                    label: 'Ngôn ngữ tư vấn',
                                    value: mentor.consultationLang || 'Việt / English',
                                    accent: 'from-violet-500/10 to-violet-600/5',
                                    iconBg: 'bg-violet-500/10 text-violet-600',
                                },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    {...fadeScale(0.18 + i * 0.06)}
                                    className={cn(
                                        'group relative overflow-hidden rounded-[24px] border border-border/50 bg-gradient-to-br p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
                                        stat.accent,
                                    )}
                                >
                                    <div className={cn('mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl', stat.iconBg)}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                                    <p className="mt-1.5 text-lg font-bold text-foreground">{stat.value}</p>
                                </motion.div>
                            ))}
                        </motion.section>

                        {/* ══════════════════════════════════════════
                         * 3. CONTENT GRID: Bio + Sidebar
                         * ══════════════════════════════════════════ */}
                        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
                            {/* Left column */}
                            <div className="space-y-8">
                                {/* Bio */}
                                <motion.section
                                    {...fadeUp(0.16)}
                                    className="overflow-hidden rounded-[28px] border border-border/50 bg-white"
                                >
                                    <div className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent px-6 py-5 sm:px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <MessageCircle size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Giới thiệu</p>
                                                <h2 className="text-lg font-bold text-foreground">Mentor này có thể giúp gì cho bạn?</h2>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-6 sm:px-8">
                                        <p className="whitespace-pre-wrap text-base leading-[1.85] text-foreground/90">
                                            {mentor.bio || 'Mentor chưa cập nhật phần giới thiệu chi tiết.'}
                                        </p>
                                    </div>
                                </motion.section>

                                {/* Expertise */}
                                <motion.section
                                    {...fadeUp(0.22)}
                                    className="rounded-[28px] border border-border/50 bg-white p-6 sm:p-8"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                                            <Sparkles size={18} />
                                        </div>
                                        <h2 className="text-lg font-bold text-foreground">Chuyên môn nổi bật</h2>
                                    </div>
                                    <div className="mt-5 flex flex-wrap gap-2.5">
                                        {mentor.expertise.length > 0 ? (
                                            mentor.expertise.map((item, i) => (
                                                <motion.span
                                                    key={item}
                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
                                                    className="inline-flex cursor-default items-center rounded-full border border-primary/15 bg-gradient-to-br from-primary/8 to-primary/3 px-4 py-2 text-sm font-medium text-foreground transition-all hover:scale-105 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
                                                >
                                                    {item}
                                                </motion.span>
                                            ))
                                        ) : (
                                            <Badge variant="outline" className="border-border/70 bg-background px-4 py-2 text-sm text-foreground/85">
                                                {mentor.expertiseArea || 'Đang cập nhật'}
                                            </Badge>
                                        )}
                                    </div>
                                </motion.section>

                                {/* Context cards */}
                                <motion.section
                                    {...fadeUp(0.28)}
                                    className="grid gap-5 sm:grid-cols-2"
                                >
                                    {[
                                        { icon: <Building2 size={20} />, label: 'Công ty hiện tại', value: mentor.currentCompany, color: 'blue' },
                                        { icon: <Briefcase size={20} />, label: 'Vị trí', value: mentor.currentJobTitle || mentor.title, color: 'cyan' },
                                        { icon: <GraduationCap size={20} />, label: 'Trường học', value: mentor.currentSchool, color: 'emerald' },
                                        { icon: <Globe2 size={20} />, label: 'Hình thức tư vấn', value: 'Online 1:1', color: 'violet' },
                                    ].map((ctx, i) => (
                                        <motion.div
                                            key={ctx.label}
                                            {...fadeScale(0.32 + i * 0.05)}
                                            className="group rounded-[22px] border border-border/50 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                                        >
                                            <div className={cn(
                                                'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl',
                                                ctx.color === 'blue' && 'bg-blue-500/10 text-blue-600',
                                                ctx.color === 'cyan' && 'bg-cyan-500/10 text-cyan-600',
                                                ctx.color === 'emerald' && 'bg-emerald-500/10 text-emerald-600',
                                                ctx.color === 'violet' && 'bg-violet-500/10 text-violet-600',
                                            )}>
                                                {ctx.icon}
                                            </div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{ctx.label}</p>
                                            <p className="mt-1.5 font-medium text-foreground">{ctx.value || 'Đang cập nhật'}</p>
                                        </motion.div>
                                    ))}
                                </motion.section>
                            </div>

                            {/* Right sidebar */}
                            <motion.aside
                                {...fadeUp(0.18)}
                                className="space-y-6 lg:sticky lg:top-24"
                            >
                                {/* Quick booking card */}
                                <div className="overflow-hidden rounded-[28px] border border-border/50 bg-white shadow-xl shadow-primary/5">
                                    <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-5">
                                        <p className="text-sm font-bold text-white/90">Sẵn sàng bắt đầu?</p>
                                        <p className="mt-1 text-2xl font-black text-white">
                                            {formatMentorHourlyRate(mentor.hourlyRate)}
                                            <span className="ml-1 text-sm font-normal text-white/70">/giờ</span>
                                        </p>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {canBookMentor ? (
                                                <Button
                                                    size="lg"
                                                    className="w-full justify-center gap-2 rounded-2xl py-3 text-base font-bold shadow-lg shadow-primary/15"
                                                    onClick={() => setBookingOpen(true)}
                                                >
                                                    <CalendarCheck2 size={18} /> Đặt lịch ngay
                                                </Button>
                                            ) : !isAuthenticated ? (
                                                <Link
                                                    to={`/auth/login?redirect=/mentors/${slug}`}
                                                    className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center gap-2 rounded-2xl py-3 text-base font-bold')}
                                                >
                                                    Đăng nhập để đặt lịch
                                                </Link>
                                            ) : null}
                                            <Link
                                                to="/test"
                                                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-center gap-2 rounded-2xl py-3')}
                                            >
                                                Làm trắc nghiệm trước <ArrowRight size={15} />
                                            </Link>
                                        </div>

                                        {/* Trust signals */}
                                        <div className="mt-6 space-y-3 border-t border-border/40 pt-5">
                                            {[
                                                { icon: <BadgeCheck size={16} />, text: 'Profile đã được xác minh bởi IT Compass' },
                                                { icon: <Clock3 size={16} />, text: 'Phản hồi trong vòng 24 giờ' },
                                                { icon: <Star size={16} />, text: `${mentor.reviewCount} đánh giá từ mentee` },
                                            ].map((signal) => (
                                                <div key={signal.text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                    <span className="mt-0.5 text-primary">{signal.icon}</span>
                                                    {signal.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick test suggestion */}
                                <div className="rounded-[22px] border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-5">
                                    <p className="text-sm font-bold text-foreground">Chưa chắc hướng đi?</p>
                                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                        Làm trắc nghiệm định hướng nghề nghiệp IT miễn phí để nhận gợi ý mentor phù hợp nhất.
                                    </p>
                                    <Link
                                        to="/test"
                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-primary"
                                    >
                                        Bắt đầu ngay <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </motion.aside>
                        </div>
                    </div>
                )}
            </main>

            {/* ══════════════════════════════════════════
             * STICKY FLOATING CTA
             * ══════════════════════════════════════════ */}
            {mentor && (canBookMentor || !isAuthenticated) && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: showStickyCta ? 0 : 100 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed left-0 right-0 z-50 border-t border-border/50 bg-white/80 backdrop-blur-xl bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0"
                >
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <Avatar src={mentor.avatarUrl} alt={mentor.name} className="h-10 w-10" />
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-foreground">{mentor.name}</p>
                                <p className="text-xs text-muted-foreground">{formatMentorHourlyRate(mentor.hourlyRate)}/giờ</p>
                            </div>
                        </div>
                        {canBookMentor ? (
                            <Button
                                size="lg"
                                className="gap-2 rounded-2xl px-6 font-bold shadow-lg shadow-primary/15"
                                onClick={() => setBookingOpen(true)}
                            >
                                <CalendarCheck2 size={16} /> Đặt lịch tư vấn
                            </Button>
                        ) : (
                            <Link
                                to={`/auth/login?redirect=/mentors/${slug}`}
                                className={cn(buttonVariants({ size: 'lg' }), 'gap-2 rounded-2xl px-6 font-bold')}
                            >
                                Đăng nhập để đặt lịch
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </>
    );
}
