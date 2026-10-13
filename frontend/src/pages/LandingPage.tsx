/**
 * @file LandingPage.tsx - IT Compass Landing Page (Cinematic Rebuild).
 *
 * Design: Split hero + parallax + scroll-triggered cinematic sections.
 * Motion level: Apple product-page inspired.
 */

import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    motion,
    useScroll,
    useTransform,
    useInView,
} from 'motion/react';
import {
    ArrowRight,
    BookOpen,
    Users,
    BarChart3,
    ClipboardCheck,
    Sparkles,
    ChevronRight,
    Code2,
    Database,
    Shield,
    Palette,
    ClipboardList,
    PieChart,
    Rocket,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { buttonVariants } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { CompassLogo } from '../components/shared/CompassLogo';
import { blogApi } from '../lib/blogApi';
import { blogQueryKeys } from '../lib/blogQueryKeys';
import { mentorApi, getMentorHeadline } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { CAREER_PATHS } from '../data/careerPaths';
import { toApiAssetUrl } from '../lib/authApi';
import { cn } from '../lib/utils';
import { AssessmentFacts } from '../components/assessment/AssessmentFacts';

/* ─── Shared motion helpers ──────────────────────────────────────────── */

// Trả về ref + trạng thái nhìn thấy để bật animation cho từng section đúng lúc.
function useSectionInView() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    return { ref, isInView };
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE },
    },
};

// Stagger nhẹ để text hiện dần, tránh dồn animation cùng lúc.
const stagger = {
    hidden: {},
    // Giảm stagger delay → H1 xuất hiện sớm hơn → LCP cải thiện
    visible: { transition: { staggerChildren: 0.06 } },
};

const fadeChild = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 1 — HERO (Split layout + parallax compass)                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });
    const compassY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Chỉ mount vòng trang trí sau first paint để tránh ảnh hưởng CLS.
    const [ringsVisible, setRingsVisible] = useState(false);
    useEffect(() => {
        const id1 = requestAnimationFrame(() => {
            const id2 = requestAnimationFrame(() => setRingsVisible(true));
            return () => cancelAnimationFrame(id2);
        });
        return () => cancelAnimationFrame(id1);
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative overflow-hidden min-h-[90vh] flex items-center"
            style={{ contain: 'layout' }}
        >
            {/* Background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

            {/* Gradient orbs */}
            <motion.div
                className="absolute top-1/4 -right-32 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[100px]"
                animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-accent/[0.06] blur-[80px]"
                animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
                style={{ opacity }}
                className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 py-16"
            >
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left — Text */}
                    <motion.div
                        style={{ y: textY }}
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                        className="space-y-6 text-center lg:text-left"
                        layout={false}
                    >
                        <motion.div variants={fadeChild}>
                            <Badge variant="secondary" className="gap-1.5 px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                <Sparkles size={15} className="text-primary" /> Khám phá hướng đi CNTT
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={fadeChild}
                            className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
                        >
                            Khám phá hướng đi{' '}
                            <span className="relative">
                                <span className="text-primary">CNTT</span>
                                <motion.span
                                    className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/20 rounded-full"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6, ease: EASE }}
                                    style={{ originX: 0 }}
                                />
                            </span>{' '}
                            từ điều bạn thích
                        </motion.h1>

                        <motion.p
                            variants={fadeChild}
                            className="max-w-xl text-lg text-muted-foreground leading-relaxed mx-auto lg:mx-0"
                        >
                            Tìm hiểu công việc CNTT, ghi nhận sở thích và chọn một bước để khám phá tiếp. Bạn có thể bắt đầu mà chưa biết lập trình.
                        </motion.p>

                        <motion.div
                            variants={fadeChild}
                            className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
                        >
                            <Link
                                to="/test"
                                className={cn(
                                    buttonVariants({ size: 'xl' }),
                                    'gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow',
                                )}
                            >
                                Khám phá bản thân <ArrowRight size={18} />
                            </Link>
                            <Link
                                to="/majors"
                                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'gap-1')}
                            >
                                Xem các hướng đi IT <ChevronRight size={16} />
                            </Link>
                        </motion.div>

                        <motion.div
                            variants={fadeChild}
                            className="text-sm leading-6 text-muted-foreground max-w-xl mx-auto lg:mx-0"
                        >
                            Bài định hướng gợi ý từ câu trả lời, không phải đánh giá năng lực hay kết luận nghề nghiệp.
                        </motion.div>
                    </motion.div>

                    {/* Right — Compass illustration */}
                    <motion.div
                        style={{ y: compassY, willChange: 'transform', contain: 'layout style paint' }}
                        className="relative flex items-center justify-center"
                    >
                        {/* Rotating rings — lazy-mounted AFTER first paint to avoid CLS */}
                        {ringsVisible && (
                            <>
                                <svg
                                    className="ring-spin-slow pointer-events-none absolute"
                                    style={{ width: 'calc(100% + 3rem)', height: 'calc(100% + 3rem)', inset: '-1.5rem' }}
                                    viewBox="0 0 100 100"
                                    aria-hidden="true"
                                >
                                    <circle
                                        cx="50" cy="50" r="48"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="0.35"
                                        strokeDasharray="2 4"
                                        className="text-primary/25"
                                    />
                                </svg>
                                <svg
                                    className="ring-spin-slow-reverse pointer-events-none absolute"
                                    style={{ width: 'calc(100% + 6rem)', height: 'calc(100% + 6rem)', inset: '-3rem' }}
                                    viewBox="0 0 100 100"
                                    aria-hidden="true"
                                >
                                    <circle
                                        cx="50" cy="50" r="48"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="0.15"
                                        strokeDasharray="1 6"
                                        className="text-primary/10"
                                    />
                                </svg>
                            </>
                        )}

                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.7, ease: EASE }}
                            className="relative compass-enter-rotate"
                        >
                            {/* Glow ring */}
                            <div className="absolute inset-0 -m-8 rounded-full bg-primary/[0.05] blur-2xl" />

                            {/* Main compass */}
                            <CompassLogo size={280} className="text-foreground relative z-10" />

                            {/* Floating tags with lucide icons */}
                            {[
                                { label: 'Software Engineer', Icon: Code2, x: '110%', y: '15%', delay: 1, color: 'text-blue-600' },
                                { label: 'Data Science', Icon: Database, x: '-60%', y: '25%', delay: 1.3, color: 'text-emerald-600' },
                                { label: 'Cybersecurity', Icon: Shield, x: '105%', y: '75%', delay: 1.6, color: 'text-red-500' },
                                { label: 'UI/UX Design', Icon: Palette, x: '-60%', y: '70%', delay: 1.9, color: 'text-violet-600' },
                            ].map((tag) => (
                                <motion.div
                                    key={tag.label}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: tag.delay, duration: 0.5, ease: EASE }}
                                    className="absolute hidden lg:block"
                                    style={{ left: tag.x, top: tag.y }}
                                >
                                    <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground shadow-lg border border-border/60 whitespace-nowrap">
                                        <tag.Icon size={16} className={tag.color} />
                                        {tag.label}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 2 — FEATURES (Icon grid with counter animation)              */
/* ═══════════════════════════════════════════════════════════════════════ */

const FEATURES = [
    {
        icon: ClipboardCheck,
        title: 'Bài định hướng sở thích',
        desc: 'Ghi nhận sở thích qua câu hỏi theo nhóm Holland và lựa chọn trong tình huống CNTT.',
        assessmentFacts: true,
        detail: 'Xem bộ câu hỏi',
    },
    {
        icon: BarChart3,
        title: 'Phân tích chi tiết',
        desc: 'Xem điểm các nhóm sở thích cùng hướng nghề và ngành học liên quan để tìm hiểu thêm.',
        detail: 'Gợi ý tham khảo',
    },
    {
        icon: Users,
        title: 'Trao đổi với mentor',
        desc: 'Xem hồ sơ, chuyên môn và lịch tư vấn của mentor trước khi gửi yêu cầu đặt lịch.',
        detail: 'Tư vấn 1:1',
    },
    {
        icon: BookOpen,
        title: 'Kiến thức nhập môn',
        desc: 'Đọc các bài viết đang được công bố về học tập, công việc và kinh nghiệm trong CNTT.',
        detail: 'Khám phá blog',
    },
];

function FeaturesSection() {
    const { ref, isInView } = useSectionInView();

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-surface/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeChild} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                        Nền tảng toàn diện
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        Tại sao chọn IT Compass?
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {FEATURES.map((f) => (
                        <motion.div
                            key={f.title}
                            variants={fadeChild}
                            className="group relative rounded-2xl border-2 border-border/60 bg-background p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/30"
                        >
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                                <f.icon size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                            <div className="border-t pt-3">
                                <span className="text-sm font-semibold text-primary">{f.assessmentFacts ? <AssessmentFacts /> : f.detail}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 3 — CAREER PATHS (Alternating cards with scroll reveal)      */
/* ═══════════════════════════════════════════════════════════════════════ */

function CareerPathsSection() {
    const { ref, isInView } = useSectionInView();

    return (
        <section ref={ref} className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeChild} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                        Khám phá lĩnh vực
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        {CAREER_PATHS.length} hướng đi trong ngành CNTT
                    </motion.h2>
                    <motion.p variants={fadeChild} className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                        So sánh công việc, hoạt động và kiến thức nhập môn để chọn hướng tìm hiểu.
                    </motion.p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {CAREER_PATHS.map((path, idx) => (
                        <motion.div
                            key={path.slug}
                            variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.97 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    transition: { duration: 0.5, delay: idx * 0.08, ease: EASE },
                                },
                            }}
                        >
                            <Link
                                to={`/majors/${path.slug}`}
                                className="group block rounded-2xl border-2 border-border/60 bg-background p-6 h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/30"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', path.iconBg)}>
                                        <path.icon size={22} className={path.iconColor} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                            {path.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">{path.headline}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                    {path.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {path.matchedCareers.map((c) => (
                                        <Badge key={c} variant="secondary" className="text-xs">
                                            {c}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
                                    Tìm hiểu thêm <ArrowRight size={14} className="ml-1 transition-transform sm:group-hover:translate-x-1" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 4 — HOW IT WORKS (Cinematic 3-step process)                  */
/* ═══════════════════════════════════════════════════════════════════════ */

const STEPS = [
    {
        number: '01',
        Icon: ClipboardList,
        title: 'Làm bài trắc nghiệm',
        desc: 'Trả lời câu hỏi về điều bạn thích và cách bạn lựa chọn trong tình huống. Thông tin số câu và thời gian tham khảo nằm ở trang bài định hướng.',
        color: 'from-blue-500/10 to-blue-600/5',
        iconColor: 'text-blue-600',
    },
    {
        number: '02',
        Icon: PieChart,
        title: 'Nhận kết quả chi tiết',
        desc: 'Xem điểm các nhóm sở thích và hướng đi gợi ý. Kết quả phản ánh câu trả lời, không đo năng lực hay dự đoán thành công trong nghề.',
        color: 'from-emerald-500/10 to-emerald-600/5',
        iconColor: 'text-emerald-600',
    },
    {
        number: '03',
        Icon: Rocket,
        title: 'Lên kế hoạch hành động',
        desc: 'Tìm hiểu ngành học, đọc blog và cân nhắc trao đổi với mentor để chọn bước tiếp theo.',
        color: 'from-amber-500/10 to-amber-600/5',
        iconColor: 'text-amber-600',
    },
];

function StepsSection() {
    const { ref, isInView } = useSectionInView();

    return (
        <section id="how-it-works" ref={ref} className="py-24 sm:py-32 bg-surface/50">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeChild} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                        Quy trình đơn giản
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        Bắt đầu chỉ với 3 bước
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="space-y-6"
                >
                    {STEPS.map((step, idx) => (
                        <motion.div
                            key={step.number}
                            variants={{
                                hidden: { opacity: 0, x: idx % 2 === 0 ? -40 : 40 },
                                visible: {
                                    opacity: 1,
                                    x: 0,
                                    transition: { duration: 0.6, delay: idx * 0.15, ease: EASE },
                                },
                            }}
                            className={cn(
                                'flex flex-col sm:flex-row items-center gap-6 rounded-2xl border-2 border-border/50 bg-gradient-to-br p-8 shadow-sm',
                                step.color,
                            )}
                        >
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black">
                                {step.number}
                            </div>
                            <div className="text-center sm:text-left">
                                <div className="mb-2"><step.Icon size={28} className={step.iconColor} /></div>
                                <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                                <p className="mt-1 text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={sectionVariants}
                    className="text-center mt-12"
                >
                    <Link
                        to="/test"
                        className={cn(
                            buttonVariants({ size: 'xl' }),
                            'gap-2 shadow-lg shadow-primary/20',
                        )}
                    >
                        Bắt đầu ngay <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 5 — FEATURED BLOG                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeaturedBlogSection() {
    const { ref, isInView } = useSectionInView();
    const { data, isLoading } = useQuery({
        queryKey: blogQueryKeys.published,
        queryFn: () => blogApi.listPublished(),
        staleTime: 5 * 60 * 1000,
        retry: false,
        enabled: isInView,
    });

    const posts = data?.posts?.slice(0, 3) ?? [];

    return (
        <section ref={ref} className="py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="flex items-end justify-between mb-12"
                >
                    <div>
                        <motion.p variants={fadeChild} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                            Kiến thức
                        </motion.p>
                        <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                            Blog nổi bật
                        </motion.h2>
                    </div>
                    <motion.div variants={fadeChild} className="hidden sm:block">
                        <Link to="/blog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </motion.div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-2xl border bg-background overflow-hidden">
                                <Skeleton className="aspect-video w-full" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        variants={stagger}
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {posts.map((post) => (
                            <motion.div key={post.id} variants={fadeChild}>
                                <Link
                                    to={`/blog/${post.slug}`}
                                    className="group block rounded-2xl border bg-background overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                >
                                    {post.coverImageUrl ? (
                                        <img
                                            src={toApiAssetUrl(post.coverImageUrl) ?? ''}
                                            alt={post.title}
                                            className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                                            <BookOpen size={32} className="text-primary/40" />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        {post.tag && (
                                            <Badge variant="secondary" className="text-xs mb-2">{post.tag}</Badge>
                                        )}
                                        <h3 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                            {post.author && <span>{post.author.fullName}</span>}
                                            {post.readTimeText && <span>· {post.readTimeText}</span>}
                                            <span>· {post.views} lượt xem</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : null}

                <div className="sm:hidden mt-6 text-center">
                    <Link to="/blog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                        Xem tất cả <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 6 — FEATURED MENTORS                                         */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeaturedMentorsSection() {
    const { ref, isInView } = useSectionInView();
    const paramsKey = 'top-4-by-reviews';
    const { data, isLoading } = useQuery({
        queryKey: mentorQueryKeys.list(paramsKey),
        queryFn: () => mentorApi.list({ limit: 4, sortBy: 'reviewCount', sortOrder: 'desc' }),
        staleTime: 5 * 60 * 1000,
        retry: false,
        enabled: isInView,
    });

    const mentors = data?.mentors ?? [];

    return (
        <section ref={ref} className="py-24 sm:py-32 bg-surface/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="flex items-end justify-between mb-12"
                >
                    <div>
                        <motion.p variants={fadeChild} className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                            Cộng đồng
                        </motion.p>
                        <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                            Mentor tiêu biểu
                        </motion.h2>
                    </div>
                    <motion.div variants={fadeChild} className="hidden sm:block">
                        <Link to="/mentors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                            Xem tất cả <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </motion.div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-2xl border bg-background overflow-hidden flex flex-col">
                                <div className="h-24 w-full bg-muted/30" />
                                <div className="px-5 relative flex justify-center sm:justify-start">
                                    <Skeleton className="-mt-10 h-20 w-20 rounded-full border-4 border-background" />
                                </div>
                                <div className="p-5 pt-3 space-y-3">
                                    <Skeleton className="h-5 w-3/4 mx-auto sm:mx-0" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6 mx-auto sm:mx-0" />
                                    <div className="flex gap-2 justify-center sm:justify-start pt-2">
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mentors.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        animate={isInView ? 'visible' : 'hidden'}
                        variants={stagger}
                        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {mentors.map((mentor) => (
                            <motion.div key={mentor.id} variants={fadeChild} className="h-full">
                                <Link
                                    to={`/mentors/${mentor.slug}`}
                                    className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-background overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40"
                                >
                                    {/* Cover Gradient */}
                                    <div className="h-24 w-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
                                    </div>

                                    {/* Avatar */}
                                    <div className="px-5 relative flex justify-center sm:justify-start">
                                        <div className="-mt-10 rounded-full border-[3px] border-background bg-background shadow-sm overflow-hidden h-[76px] w-[76px] flex items-center justify-center">
                                            <Avatar src={mentor.avatarUrl} alt={mentor.name} className="h-full w-full" />
                                        </div>
                                        {mentor.isVerified && (
                                            <div className="absolute top-2 right-4 flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-blue-600 dark:text-blue-400">
                                                <CheckCircle2 size={12} />
                                                <span>VERIFIED</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-1 p-5 pt-3">
                                        <div className="text-center sm:text-left mb-3">
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                {mentor.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                                {getMentorHeadline(mentor)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mb-auto">
                                            {mentor.expertise?.slice(0, 3).map((e) => (
                                                <Badge key={e} variant="secondary" className="text-[10px] font-medium px-2 py-0.5 bg-secondary/40">
                                                    {e}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Bottom Meta */}
                                        <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1 font-medium text-foreground">
                                                    <Users size={13} />
                                                    <span>{mentor.reviewCount} đánh giá</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={13} />
                                                    <span>{mentor.yearsOfExperience ? `${mentor.yearsOfExperience} năm KN` : 'Chưa cập nhật'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                                                <ArrowRight size={16} className="-rotate-45 transition-transform duration-300 group-hover:rotate-0" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : null}

                <div className="sm:hidden mt-8 text-center">
                    <Link to="/mentors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                        Xem tất cả <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Section 7 — FINAL CTA                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

function FinalCTASection() {
    const { ref, isInView } = useSectionInView();

    return (
        <section ref={ref} className="py-24 sm:py-32">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <motion.div
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    variants={stagger}
                    className="relative text-center rounded-3xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border p-12 sm:p-16 overflow-hidden"
                >
                    {/* Decorative compass in background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
                        <CompassLogo size={400} animate={false} />
                    </div>

                    <motion.div variants={fadeChild} className="relative z-10">
                        <CompassLogo size={48} className="text-primary mx-auto mb-6" />
                    </motion.div>
                    <motion.h2
                        variants={fadeChild}
                        className="relative z-10 text-3xl font-bold text-foreground sm:text-4xl"
                    >
                        Sẵn sàng tìm ra hướng đi?
                    </motion.h2>
                    <motion.p
                        variants={fadeChild}
                        className="relative z-10 mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
                    >
                        Ghi nhận điều bạn thích, xem các hướng đi gợi ý và chọn một lĩnh vực để tìm hiểu thêm. Bạn có thể bắt đầu bài định hướng trước khi đăng nhập; cần đăng nhập để lưu và xem kết quả.
                    </motion.p>
                    <motion.div variants={fadeChild} className="relative z-10 mt-8">
                        <Link
                            to="/test"
                            className={cn(
                                buttonVariants({ size: 'xl' }),
                                'gap-2 shadow-lg shadow-primary/20 hover:shadow-xl',
                            )}
                        >
                            Bắt đầu trắc nghiệm miễn phí <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* PAGE                                                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
    return (
        <>
            <Helmet>
                <title>IT Compass — La Bàn Nghề Nghiệp IT</title>
                <meta
                    name="description"
                    content="Khám phá sở thích, tìm hiểu công việc CNTT, xem gợi ý tham khảo và trao đổi với mentor. Bắt đầu mà chưa cần biết lập trình."
                />
            </Helmet>
            <main className="overflow-x-clip">
                <HeroSection />
                <FeaturesSection />
                <CareerPathsSection />
                <StepsSection />
                <ErrorBoundary>
                    <FeaturedBlogSection />
                </ErrorBoundary>
                <ErrorBoundary>
                    <FeaturedMentorsSection />
                </ErrorBoundary>
                <FinalCTASection />
            </main>
        </>
    );
}

