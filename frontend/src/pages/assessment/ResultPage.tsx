import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    Brain,
    Compass,
    GraduationCap,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Badge } from '../../components/ui/Badge';
import { buttonVariants } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { getErrorMessage } from '../../lib/appError';
import type { AssessmentAttempt, HollandBreakdownItem } from '../../lib/assessmentApi';
import { assessmentApi } from '../../lib/assessmentApi';
import { assessmentQueryKeys } from '../../lib/assessmentQueryKeys';
import { cn } from '../../lib/utils';
import { MAJORS_LIST } from '../../lib/constants/majors';
import { HOLLAND_TRAIT_MAP } from '../../lib/constants/holland';



const traitTone: Record<string, string> = {
    R: 'border-sky-200 bg-sky-50 text-sky-700',
    I: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    A: 'border-pink-200 bg-pink-50 text-pink-700',
    S: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    E: 'border-amber-200 bg-amber-50 text-amber-700',
    C: 'border-slate-200 bg-slate-50 text-slate-700',
};

function ResultSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-[400px] rounded-[36px]" />
            <Skeleton className="h-64 rounded-[32px]" />
            <Skeleton className="h-64 rounded-[32px]" />
        </div>
    );
}

function BreakdownCard({ item }: { item: HollandBreakdownItem }) {
    return (
        <div className="rounded-[24px] border border-border/60 bg-background p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <Badge className={cn('border px-3 py-1 text-[11px] uppercase tracking-[0.18em]', traitTone[item.code] ?? 'border-border bg-secondary text-foreground')}>
                        {item.code} - {HOLLAND_TRAIT_MAP[item.code] || item.code}
                    </Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Top {item.rank}</span>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black tracking-tight text-foreground">{item.percent}%</p>
                </div>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary/70">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500" style={{ width: `${item.percent}%` }} />
            </div>
        </div>
    );
}

export default function ResultPage() {
    const location = useLocation();
    const stateAttempt = (location.state as { attempt?: AssessmentAttempt } | null)?.attempt ?? null;

    const latestAttemptQuery = useQuery({
        queryKey: assessmentQueryKeys.latestAttempt,
        queryFn: () => assessmentApi.getLatestAttempt(),
        initialData: stateAttempt ? { attempt: stateAttempt } : undefined,
    });

    const attempt = latestAttemptQuery.data?.attempt ?? stateAttempt ?? null;
    const ranking = attempt?.summary.ranking ?? [];
    const breakdown = attempt?.summary.hollandBreakdown ?? [];
    const recommendations = ranking.slice(0, 3);
    const matchedMajors = MAJORS_LIST.filter((m) => attempt?.summary.suggestedMajors.includes(m.title));

    return (
        <>
            <Helmet>
                <title>{attempt ? `${attempt.summary.title} — Kết quả assessment IT Compass` : 'Kết quả assessment — IT Compass'}</title>
                <meta
                    name="description"
                    content={attempt?.summary.headline || 'Xem kết quả assessment mới nhất, nhóm nghề phù hợp và các gợi ý học tập tiếp theo từ IT Compass.'}
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                {latestAttemptQuery.isLoading && !attempt ? (
                    <ResultSkeleton />
                ) : latestAttemptQuery.error ? (
                    <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-14">
                        <EmptyState
                            icon={<Brain size={28} />}
                            title="Không thể tải kết quả assessment"
                            description={getErrorMessage(latestAttemptQuery.error, 'Đã có lỗi khi tải kết quả gần nhất của bạn.')}
                            action={
                                <Link to="/test" className={buttonVariants({ variant: 'outline' })}>
                                    Quay lại bài trắc nghiệm
                                </Link>
                            }
                        />
                    </div>
                ) : !attempt ? (
                    <div className="rounded-[28px] border border-border/60 bg-surface/40 px-6 py-14">
                        <EmptyState
                            icon={<Compass size={28} />}
                            title="Bạn chưa có kết quả assessment"
                            description="Hãy làm bài trắc nghiệm để mở khóa kết quả định hướng, gợi ý chuyên ngành và các bước tiếp theo phù hợp với bạn."
                            action={
                                <Link to="/test/quiz" className={buttonVariants({ size: 'lg' })}>
                                    Bắt đầu làm bài <ArrowRight size={16} />
                                </Link>
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-8">
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="relative flex flex-col items-center text-center overflow-hidden rounded-[36px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.18),transparent_26%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] px-6 py-12 sm:px-10 sm:py-16"
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                            <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                                <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                                    {attempt.resultCode} · Hồ sơ năng lực
                                </Badge>
                                <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl sm:leading-[1.04]">
                                    {attempt.summary.title}
                                </h1>
                                <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                                    {attempt.summary.headline}
                                </p>
                                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/90 sm:text-base">
                                    {attempt.summary.description}
                                </p>

                                <div className="mt-8 flex flex-wrap justify-center gap-2.5">
                                    {attempt.summary.topTraits.map((trait) => (
                                        <Badge
                                            key={trait}
                                            className={cn('border px-4 py-1.5 text-sm uppercase tracking-[0.16em]', traitTone[trait] ?? 'border-border bg-secondary text-foreground')}
                                        >
                                            {trait} - {HOLLAND_TRAIT_MAP[trait] || trait}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </motion.section>

                        <div className="space-y-8 max-w-5xl mx-auto">
                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.06 }}
                                className="rounded-[32px] border border-border/60 bg-background p-6 sm:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Gợi ý phù hợp nhất</p>
                                        <h2 className="mt-1 text-2xl font-bold text-foreground">Top hướng đi nên ưu tiên</h2>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4">
                                    {recommendations.length > 0 ? (
                                        recommendations.map((item, index) => (
                                            <div key={item.resultCode} className="rounded-[26px] border border-border/60 bg-surface/45 p-5">
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                                            #{index + 1} · {item.confidence}
                                                        </div>
                                                        <h3 className="mt-3 text-xl font-bold text-foreground">{item.title}</h3>
                                                        <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.headline}</p>
                                                    </div>
                                                    <div className="rounded-[20px] border border-primary/15 bg-background px-4 py-3 text-center sm:min-w-[96px]">
                                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Khớp</p>
                                                        <p className="mt-1 text-2xl font-black text-primary">{item.matchPercent}%</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {item.primaryTraits.map((trait) => (
                                                        <Badge
                                                            key={`${item.resultCode}-${trait}`}
                                                            className={cn('border px-3 py-1 text-xs uppercase tracking-[0.16em]', traitTone[trait] ?? 'border-border bg-secondary text-foreground')}
                                                        >
                                                            {trait} - {HOLLAND_TRAIT_MAP[trait] || trait}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-[24px] border border-border/60 bg-surface/45 p-5 text-sm text-muted-foreground">
                                            Kết quả hiện chưa có bảng xếp hạng chi tiết để hiển thị.
                                        </div>
                                    )}
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.12 }}
                                className="rounded-[32px] border border-border/60 bg-background p-6 sm:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <BarChart3 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Holland breakdown</p>
                                        <h2 className="mt-1 text-2xl font-bold text-foreground">Bức tranh thiên hướng của bạn</h2>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {breakdown.length > 0 ? (
                                        breakdown.map((item) => <BreakdownCard key={item.code} item={item} />)
                                    ) : (
                                        <div className="rounded-[24px] border border-border/60 bg-surface/45 p-5 text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                                            Chưa có dữ liệu breakdown chi tiết cho lượt assessment này.
                                        </div>
                                    )}
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.18 }}
                                className="rounded-[32px] border border-border/60 bg-background p-6 sm:p-8"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                                        <GraduationCap size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Academic Fit</p>
                                        <h2 className="mt-1 text-2xl font-bold text-foreground">Ngành học được đề xuất</h2>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                    {matchedMajors.length > 0 ? (
                                        matchedMajors.map((major) => {
                                            const Icon = major.icon;
                                            return (
                                                <Link
                                                    key={major.slug}
                                                    to={`/majors/${major.slug}`}
                                                    className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-border/60 bg-surface/45 p-5 transition-all hover:border-primary/30 hover:bg-surface/80"
                                                >
                                                    <div className="space-y-4">
                                                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', major.iconBg, major.iconColor)}>
                                                            <Icon size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-foreground transition-colors group-hover:text-primary">{major.title}</h3>
                                                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{major.headline}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-primary">
                                                        <span>Xem lộ trình ngành này</span>
                                                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                </Link>
                                            )
                                        })
                                    ) : (
                                        <div className="rounded-[24px] border border-border/60 bg-surface/45 p-5 text-sm text-muted-foreground sm:col-span-2">
                                            Dựa trên kết quả, chúng tôi sẽ cập nhật gợi ý chuyên ngành.
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                            <motion.section
                                initial={{ opacity: 0, y: 22 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="grid gap-6 sm:grid-cols-2"
                            >
                                <div className="rounded-[32px] border border-border/60 bg-surface/45 p-6 sm:p-8 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <BadgeCheck size={20} className="text-primary" />
                                        <h3 className="text-xl font-bold text-foreground">Nghề nghiệp liên quan</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {attempt.summary.matchedCareers.length > 0 ? (
                                            attempt.summary.matchedCareers.map((career) => (
                                                <Badge key={career} variant="outline" className="border-border/70 bg-background px-4 py-1.5 text-sm text-foreground/80">
                                                    {career}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Chưa có gợi ý cụ thể.</span>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-border/50">
                                        <Link to="/test/quiz" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-center')}>
                                            Thực hiện lại bài đánh giá
                                        </Link>
                                    </div>
                                </div>

                                <div className="rounded-[32px] border border-border/60 bg-surface/45 p-6 sm:p-8 flex flex-col h-full">
                                    <div className="flex items-center gap-3 mb-6">
                                        <UserRound size={20} className="text-primary" />
                                        <h3 className="text-xl font-bold text-foreground">Kết nối Mentor</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {attempt.summary.suggestedMentorExpertise.length > 0 ? (
                                            attempt.summary.suggestedMentorExpertise.map((item) => (
                                                <Badge key={item} variant="outline" className="border-border/70 bg-background px-4 py-1.5 text-sm text-foreground/80">
                                                    {item}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Chưa có expertise đề xuất.</span>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-6 border-t border-border/50">
                                        <Link to="/mentors" className={cn(buttonVariants({ size: 'lg' }), 'w-full justify-center')}>
                                            Khám phá Mentor phù hợp
                                        </Link>
                                    </div>
                                </div>
                            </motion.section>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
