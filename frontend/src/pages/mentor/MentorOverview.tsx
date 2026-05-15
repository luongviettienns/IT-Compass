/**
 * @file MentorOverview.tsx - Trang tổng quan Mentor Portal.
 *
 * Hiển thị welcome banner, stats cards, quick facts, và checklist hoàn thiện hồ sơ.
 */

import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    BadgeCheck,
    Briefcase,
    CheckCircle2,
    Circle,
    Clock3,
    Globe2,
    GraduationCap,
    Sparkles,
    TrendingUp,
    UserPen,
    Users,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../../lib/mentorApi';
import { mentorQueryKeys } from '../../lib/mentorQueryKeys';
import { getErrorMessage } from '../../lib/appError';
import { cn } from '../../lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Đang nhận tư vấn',
    PAUSED: 'Tạm dừng',
};

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(value, 100) / 100) * circumference;
    const tone = value >= 80 ? 'text-emerald-500' : value >= 50 ? 'text-amber-500' : 'text-primary';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-secondary"
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={tone}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: EASE }}
                    strokeDasharray={circumference}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn('text-lg font-black', tone)}>{value}%</span>
            </div>
        </div>
    );
}

export default function MentorOverview() {
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.dashboard,
        queryFn: mentorApi.getDashboard,
    });

    const mentor = data?.mentor;
    const stats = data?.stats;

    if (isLoading) {
        return (
            <div className="flex h-[420px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !mentor || !stats) {
        return (
            <div className="p-8">
                <EmptyState
                    icon={<Users size={28} />}
                    title="Không thể tải bảng điều khiển"
                    description={getErrorMessage(error, 'Phiên mentor chưa sẵn sàng.')}
                />
            </div>
        );
    }

    const quickFacts = [
        {
            icon: Clock3,
            label: 'Kinh nghiệm',
            value: mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : 'Chưa cập nhật',
        },
        {
            icon: Briefcase,
            label: 'Chi phí / giờ',
            value: formatMentorHourlyRate(mentor.hourlyRate),
        },
        {
            icon: Globe2,
            label: 'Ngôn ngữ tư vấn',
            value: mentor.consultationLang || 'Việt / English',
        },
        {
            icon: GraduationCap,
            label: 'Tổ chức',
            value: mentor.currentCompany || mentor.currentSchool || 'Chưa cập nhật',
        },
    ];

    const completionFields = [
        { label: 'Tên hiển thị', filled: !!mentor.name },
        { label: 'Avatar', filled: !!mentor.avatarUrl },
        { label: 'Headline / Title', filled: !!mentor.title },
        { label: 'Bio giới thiệu', filled: !!mentor.bio },
        { label: 'Chuyên môn', filled: !!mentor.expertiseArea },
        { label: 'Level', filled: !!mentor.level },
        { label: 'Số năm kinh nghiệm', filled: mentor.yearsOfExperience != null },
        { label: 'Chi phí / giờ', filled: mentor.hourlyRate != null },
        { label: 'Công ty / Trường', filled: !!(mentor.currentCompany || mentor.currentSchool) },
        { label: 'Ngôn ngữ tư vấn', filled: !!mentor.consultationLang },
    ];
    const filledCount = completionFields.filter((f) => f.filled).length;

    const statCards = [
        {
            label: 'Hoàn thiện hồ sơ',
            value: `${stats.profileCompletion}%`,
            icon: TrendingUp,
            color: stats.profileCompletion >= 80 ? 'emerald' : stats.profileCompletion >= 50 ? 'amber' : 'blue',
            hasRing: true,
        },
        {
            label: 'Lượt đánh giá',
            value: stats.reviewCount.toLocaleString('vi-VN'),
            icon: Users,
            color: 'blue',
        },
        {
            label: 'Xác minh',
            value: stats.isVerified ? 'Đã xác minh' : 'Chưa xác minh',
            icon: BadgeCheck,
            color: stats.isVerified ? 'emerald' : 'amber',
        },
        {
            label: 'Trạng thái',
            value: STATUS_LABELS[stats.status] || stats.status,
            icon: Sparkles,
            color: stats.status === 'ACTIVE' ? 'emerald' : 'amber',
        },
    ];

    const colorMap: Record<string, { bg: string; text: string }> = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
    };

    return (
        <>
            <Helmet>
                <title>Tổng quan — Mentor Portal — IT Compass</title>
            </Helmet>

            <div className="p-6 sm:p-8 lg:p-10 space-y-8">
                {/* ── Welcome Banner ─────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="relative overflow-hidden rounded-[28px] border border-border/60 bg-background p-6 sm:p-8 lg:p-10"
                >
                    {/* Decorative background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(37,99,235,0.12),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(6,182,212,0.10),transparent_50%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                    {/* Floating blurs */}
                    <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-primary/10 blur-3xl animate-pulse pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-blue-300/8 blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '4s' }} />

                    <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-5">
                            <Avatar
                                src={mentor.avatarUrl}
                                alt={mentor.name}
                                size="xl"
                                className="ring-4 ring-primary/15 shadow-xl shadow-primary/10"
                            />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                        Xin chào, {mentor.name}!
                                    </h1>
                                    {stats.isVerified && <BadgeCheck className="text-primary" size={22} />}
                                </div>
                                <p className="mt-2 text-base leading-7 text-muted-foreground sm:text-lg">
                                    {getMentorHeadline(mentor)}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="border border-border/60 bg-background/80 px-3 py-1 text-xs uppercase tracking-[0.18em]"
                                    >
                                        {mentor.level || 'Level chưa cập nhật'}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary"
                                    >
                                        {STATUS_LABELS[stats.status] || stats.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => navigate('/mentor/profile')} className="gap-2 shrink-0">
                            <UserPen size={16} /> Cập nhật hồ sơ
                        </Button>
                    </div>
                </motion.section>

                {/* ── Stats Cards ─────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card, i) => {
                        const colors = colorMap[card.color] || colorMap.blue;
                        return (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05, ease: EASE }}
                                className="group rounded-[24px] border border-border/60 bg-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                            {card.label}
                                        </p>
                                        {card.hasRing ? (
                                            <div className="mt-3">
                                                <CircularProgress value={stats.profileCompletion} />
                                            </div>
                                        ) : (
                                            <p className={cn('mt-3 text-3xl font-black', colors.text)}>
                                                {card.value}
                                            </p>
                                        )}
                                    </div>
                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.bg)}>
                                        <card.icon size={20} className={colors.text} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Bottom Grid: Quick Facts + Completion Checklist ── */}
                <div className="grid gap-6 xl:grid-cols-2">
                    {/* Quick Facts */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2, ease: EASE }}
                        className="rounded-[28px] border border-primary/15 bg-primary/[0.03] p-6"
                    >
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <Sparkles size={18} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Thông tin nổi bật</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {quickFacts.map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3 transition-colors hover:bg-background"
                                >
                                    <div className="flex items-start gap-3">
                                        <item.icon size={18} className="mt-0.5 text-primary shrink-0" />
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    {/* Completion Checklist */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
                        className="rounded-[28px] border border-border/60 bg-background p-6"
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-foreground">Checklist hồ sơ</h2>
                            <span className="text-sm font-semibold text-muted-foreground">
                                {filledCount}/{completionFields.length}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 overflow-hidden rounded-full bg-secondary mb-5">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${(filledCount / completionFields.length) * 100}%` }}
                                transition={{ duration: 0.8, ease: EASE }}
                            />
                        </div>

                        <div className="space-y-2.5">
                            {completionFields.map((field) => (
                                <div
                                    key={field.label}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-secondary/30"
                                >
                                    {field.filled ? (
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                    ) : (
                                        <Circle size={18} className="text-muted-foreground/40 shrink-0" />
                                    )}
                                    <span
                                        className={cn(
                                            'text-sm',
                                            field.filled
                                                ? 'text-foreground font-medium'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {field.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {filledCount < completionFields.length && (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/mentor/profile')}
                                className="mt-5 w-full gap-2"
                            >
                                <UserPen size={16} /> Hoàn thiện hồ sơ
                            </Button>
                        )}
                    </motion.section>
                </div>
            </div>
        </>
    );
}
