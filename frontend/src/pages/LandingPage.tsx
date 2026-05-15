/**
 * @file LandingPage.tsx - IT Compass Landing Page (Cinematic Rebuild).
 *
 * Design: Split hero + parallax + scroll-triggered cinematic sections.
 * Motion level: Apple product-page inspired.
 */

import { useRef } from 'react';
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
    Star,
    Code2,
    Database,
    Shield,
    Palette,
    ClipboardList,
    PieChart,
    Rocket,
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
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { CAREER_PATHS } from '../data/careerPaths';
import { toApiAssetUrl } from '../lib/authApi';
import { cn } from '../lib/utils';

/* â”€â”€â”€ Shared motion helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

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
        transition: { duration: 0.7, ease: EASE },
    },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

const fadeChild = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 1 â€” HERO (Split layout + parallax compass)                   */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start'],
    });
    const compassY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section
            ref={containerRef}
            className="relative overflow-hidden min-h-[90vh] flex items-center"
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
                    {/* Left â€” Text */}
                    <motion.div
                        style={{ y: textY }}
                        initial="hidden"
                        animate="visible"
                        variants={stagger}
                        className="space-y-6 text-center lg:text-left"
                    >
                        <motion.div variants={fadeChild}>
                            <Badge variant="secondary" className="gap-1.5 px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                <Sparkles size={15} className="text-primary" /> Ná»n táº£ng #1 Ä‘á»‹nh hÆ°á»›ng nghá» IT
                            </Badge>
                        </motion.div>

                        <motion.h1
                            variants={fadeChild}
                            className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]"
                        >
                            TĂ¬m ra con Ä‘Æ°á»ng{' '}
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
                            phĂ¹ há»£p vá»›i báº¡n
                        </motion.h1>

                        <motion.p
                            variants={fadeChild}
                            className="max-w-xl text-lg text-muted-foreground leading-relaxed mx-auto lg:mx-0"
                        >
                            BĂ i tráº¯c nghiá»‡m Holland khoa há»c giĂºp báº¡n khĂ¡m phĂ¡ tháº¿ máº¡nh, gá»£i Ă½ ngĂ nh há»c vĂ  nghá» nghiá»‡p â€” káº¿t ná»‘i vá»›i mentor thá»±c chiáº¿n trong ngĂ nh.
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
                                Báº¯t Ä‘áº§u tráº¯c nghiá»‡m <ArrowRight size={18} />
                            </Link>
                            <a
                                href="#how-it-works"
                                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'gap-1')}
                            >
                                TĂ¬m hiá»ƒu cĂ¡ch hoáº¡t Ä‘á»™ng <ChevronRight size={16} />
                            </a>
                        </motion.div>

                        <motion.div
                            variants={fadeChild}
                            className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-2 lg:justify-start"
                        >
                            <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                    {['bg-blue-400', 'bg-green-400', 'bg-amber-400'].map((c) => (
                                        <div key={c} className={cn('h-5 w-5 rounded-full border-2 border-background', c)} />
                                    ))}
                                </div>
                                <span>500+ há»c sinh Ä‘Ă£ thá»­</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                <span>4.8/5</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right â€” Compass illustration */}
                    <motion.div
                        style={{ y: compassY }}
                        className="relative flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
                            className="relative"
                        >
                            {/* Glow ring */}
                            <div className="absolute inset-0 -m-8 rounded-full bg-primary/[0.05] blur-2xl" />

                            {/* Rotating ring decoration */}
                            <motion.div
                                className="absolute -inset-6 rounded-full border border-dashed border-primary/10"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                            />
                            <motion.div
                                className="absolute -inset-12 rounded-full border border-dotted border-primary/5"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                            />

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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 2 â€” FEATURES (Icon grid with counter animation)              */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const FEATURES = [
    {
        icon: ClipboardCheck,
        title: 'Tráº¯c nghiá»‡m Holland',
        desc: 'Dá»±a trĂªn mĂ´ hĂ¬nh RIASEC â€” tiĂªu chuáº©n vĂ ng trong tÆ° váº¥n nghá» nghiá»‡p quá»‘c táº¿.',
        stat: '30',
        statLabel: 'cĂ¢u há»i',
    },
    {
        icon: BarChart3,
        title: 'PhĂ¢n tĂ­ch chi tiáº¿t',
        desc: 'Biá»ƒu Ä‘á»“ 6 nhĂ³m tĂ­nh cĂ¡ch, gá»£i Ă½ ngĂ nh há»c cá»¥ thá»ƒ vĂ  vá»‹ trĂ­ cĂ´ng viá»‡c phĂ¹ há»£p.',
        stat: '6',
        statLabel: 'nhĂ³m phĂ¢n tĂ­ch',
    },
    {
        icon: Users,
        title: 'Mentor thá»±c chiáº¿n',
        desc: 'Káº¿t ná»‘i 1:1 vá»›i anh chá»‹ Ä‘i trÆ°á»›c â€” tá»« sinh viĂªn Ä‘áº¿n senior trong ngĂ nh IT.',
        stat: '20+',
        statLabel: 'mentor',
    },
    {
        icon: BookOpen,
        title: 'TĂ i nguyĂªn cháº¥t lÆ°á»£ng',
        desc: 'Blog chuyĂªn sĂ¢u vá» lá»™ trĂ¬nh, kinh nghiá»‡m thá»±c táº­p, vĂ  xu hÆ°á»›ng ngĂ nh IT.',
        stat: '50+',
        statLabel: 'bĂ i viáº¿t',
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
                        Ná»n táº£ng toĂ n diá»‡n
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        Táº¡i sao chá»n IT Compass?
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
                                <span className="text-2xl font-bold text-primary">{f.stat}</span>
                                <span className="text-sm text-muted-foreground ml-1.5">{f.statLabel}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 3 â€” CAREER PATHS (Alternating cards with scroll reveal)      */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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
                        KhĂ¡m phĂ¡ lÄ©nh vá»±c
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        6 hÆ°á»›ng Ä‘i trong ngĂ nh CNTT
                    </motion.h2>
                    <motion.p variants={fadeChild} className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Má»—i hÆ°á»›ng Ä‘i phĂ¹ há»£p vá»›i má»™t khuynh hÆ°á»›ng tĂ­nh cĂ¡ch khĂ¡c nhau
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
                                    TĂ¬m hiá»ƒu thĂªm <ArrowRight size={14} className="ml-1 transition-transform sm:group-hover:translate-x-1" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 4 â€” HOW IT WORKS (Cinematic 3-step process)                  */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const STEPS = [
    {
        number: '01',
        Icon: ClipboardList,
        title: 'LĂ m bĂ i tráº¯c nghiá»‡m',
        desc: '15 phĂºt, 30 cĂ¢u há»i â€” tráº£ lá»i theo trá»±c giĂ¡c. KhĂ´ng cĂ³ Ä‘Ă¡p Ă¡n Ä‘Ăºng sai, chá»‰ cĂ³ sá»± khĂ¡c biá»‡t.',
        color: 'from-blue-500/10 to-blue-600/5',
        iconColor: 'text-blue-600',
    },
    {
        number: '02',
        Icon: PieChart,
        title: 'Nháº­n káº¿t quáº£ chi tiáº¿t',
        desc: 'Biá»ƒu Ä‘á»“ Holland 6 nhĂ³m tĂ­nh cĂ¡ch, ngĂ nh há»c gá»£i Ă½, nghá» nghiá»‡p phĂ¹ há»£p vĂ  lá»™ trĂ¬nh cá»¥ thá»ƒ.',
        color: 'from-emerald-500/10 to-emerald-600/5',
        iconColor: 'text-emerald-600',
    },
    {
        number: '03',
        Icon: Rocket,
        title: 'LĂªn káº¿ hoáº¡ch hĂ nh Ä‘á»™ng',
        desc: 'Káº¿t ná»‘i mentor, Ä‘á»c blog chuyĂªn sĂ¢u, xĂ¢y dá»±ng roadmap cĂ¡ nhĂ¢n cho hĂ nh trĂ¬nh IT cá»§a báº¡n.',
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
                        Quy trĂ¬nh Ä‘Æ¡n giáº£n
                    </motion.p>
                    <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                        Báº¯t Ä‘áº§u chá»‰ vá»›i 3 bÆ°á»›c
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
                        Báº¯t Ä‘áº§u ngay <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 5 â€” FEATURED BLOG                                            */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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
                            Kiáº¿n thá»©c
                        </motion.p>
                        <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                            Blog ná»•i báº­t
                        </motion.h2>
                    </div>
                    <motion.div variants={fadeChild} className="hidden sm:block">
                        <Link to="/blog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                            Xem táº¥t cáº£ <ArrowRight size={14} />
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
                                            {post.readTimeText && <span>Â· {post.readTimeText}</span>}
                                            <span>Â· {post.views} lÆ°á»£t xem</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : null}

                <div className="sm:hidden mt-6 text-center">
                    <Link to="/blog" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                        Xem táº¥t cáº£ <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 6 â€” FEATURED MENTORS                                         */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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
                            Cá»™ng Ä‘á»“ng
                        </motion.p>
                        <motion.h2 variants={fadeChild} className="text-3xl font-bold text-foreground sm:text-4xl">
                            Mentor tiĂªu biá»ƒu
                        </motion.h2>
                    </div>
                    <motion.div variants={fadeChild} className="hidden sm:block">
                        <Link to="/mentors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                            Xem táº¥t cáº£ <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </motion.div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-2xl border bg-background p-6 text-center">
                                <Skeleton className="mx-auto h-20 w-20 rounded-full" />
                                <Skeleton className="mx-auto mt-4 h-5 w-32" />
                                <Skeleton className="mx-auto mt-2 h-4 w-40" />
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
                            <motion.div key={mentor.id} variants={fadeChild}>
                                <Link
                                    to={`/mentors/${mentor.slug}`}
                                    className="group block rounded-2xl border bg-background p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                >
                                    <Avatar src={mentor.avatarUrl} alt={mentor.name} size="lg" className="mx-auto" />
                                    <div className="mt-4">
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-center gap-1">
                                            {mentor.name}
                                            {mentor.isVerified && <span className="text-primary text-xs">âœ“</span>}
                                        </h3>
                                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                                            {getMentorHeadline(mentor)}
                                        </p>
                                    </div>
                                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                                        {mentor.expertise?.slice(0, 2).map((e) => (
                                            <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-xs text-muted-foreground">
                                        {mentor.yearsOfExperience != null && <span>{mentor.yearsOfExperience} nÄƒm KN</span>}
                                        {mentor.hourlyRate != null && <span> Â· {formatMentorHourlyRate(mentor.hourlyRate)}</span>}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : null}

                <div className="sm:hidden mt-6 text-center">
                    <Link to="/mentors" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}>
                        Xem táº¥t cáº£ <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* Section 7 â€” FINAL CTA                                                */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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
                        Sáºµn sĂ ng tĂ¬m ra hÆ°á»›ng Ä‘i?
                    </motion.h2>
                    <motion.p
                        variants={fadeChild}
                        className="relative z-10 mt-4 text-lg text-muted-foreground max-w-xl mx-auto"
                    >
                        Chá»‰ cáº§n 15 phĂºt Ä‘á»ƒ khĂ¡m phĂ¡ con Ä‘Æ°á»ng CNTT phĂ¹ há»£p nháº¥t. HĂ ng trÄƒm báº¡n tráº» Ä‘Ă£ tĂ¬m Ä‘Æ°á»£c hÆ°á»›ng Ä‘i â€” báº¡n thĂ¬ sao?
                    </motion.p>
                    <motion.div variants={fadeChild} className="relative z-10 mt-8">
                        <Link
                            to="/test"
                            className={cn(
                                buttonVariants({ size: 'xl' }),
                                'gap-2 shadow-lg shadow-primary/20 hover:shadow-xl',
                            )}
                        >
                            Báº¯t Ä‘áº§u tráº¯c nghiá»‡m miá»…n phĂ­ <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* PAGE                                                                  */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function LandingPage() {
    return (
        <>
            <Helmet>
                <title>IT Compass â€” La BĂ n Nghá» Nghiá»‡p IT</title>
                <meta
                    name="description"
                    content="KhĂ¡m phĂ¡ con Ä‘Æ°á»ng CĂ´ng nghá»‡ thĂ´ng tin phĂ¹ há»£p vá»›i báº¡n. Tráº¯c nghiá»‡m Holland khoa há»c, mentor thá»±c chiáº¿n, blog chuyĂªn sĂ¢u."
                />
            </Helmet>
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
        </>
    );
}

