/**
 * @file MentorPreview.tsx - Xem trước hồ sơ mentor giống student view.
 *
 * Hiển thị profile mentor giống như student nhìn thấy trên MentorDetailPage.
 * Có nút toggle giữa Desktop và Mobile preview.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
    BadgeCheck,
    Briefcase,
    Building2,
    Clock3,
    Eye,
    Globe2,
    GraduationCap,
    Languages,
    Monitor,
    Smartphone,
    Sparkles,
    UserPen,
    UserRound,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../../lib/mentorApi';
import type { MentorProfile } from '../../lib/mentorApi';
import { mentorQueryKeys } from '../../lib/mentorQueryKeys';
import { getErrorMessage } from '../../lib/appError';
import { cn } from '../../lib/utils';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ProfileCard({ mentor, className }: { mentor: MentorProfile; className?: string }) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.10),transparent_40%)] p-6 sm:p-8">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60 pointer-events-none" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Avatar
                        src={mentor.avatarUrl}
                        alt={mentor.name}
                        size="xl"
                        className="ring-4 ring-primary/10 shadow-lg"
                    />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            {mentor.level && (
                                <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    {mentor.level}
                                </Badge>
                            )}
                            {mentor.isVerified && (
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-background/85 px-2.5 py-1 text-xs font-semibold text-primary backdrop-blur">
                                    <BadgeCheck size={13} /> Đã xác minh
                                </div>
                            )}
                        </div>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">{mentor.name}</h2>
                        <p className="mt-2 text-base leading-7 text-muted-foreground">{getMentorHeadline(mentor)}</p>
                        {mentor.expertiseArea && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm text-foreground backdrop-blur">
                                <Sparkles size={14} className="text-primary" /> {mentor.expertiseArea}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bio */}
            <div className="rounded-[28px] border border-border/60 bg-background p-6 sm:p-8">
                <h3 className="text-xl font-bold text-foreground">Giới thiệu</h3>
                <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-foreground/90">
                    {mentor.bio || 'Mentor chưa cập nhật phần giới thiệu.'}
                </p>
            </div>

            {/* Quick Info */}
            <div className="rounded-[28px] border border-border/60 bg-background p-6 sm:p-8">
                <h3 className="text-xl font-bold text-foreground mb-5">Thông tin nhanh</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                    {[
                        { icon: Clock3, label: 'Kinh nghiệm', value: mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : 'Chưa cập nhật' },
                        { icon: Briefcase, label: 'Chi phí / giờ', value: formatMentorHourlyRate(mentor.hourlyRate) },
                        { icon: Languages, label: 'Ngôn ngữ', value: mentor.consultationLang || 'Việt / English' },
                        { icon: Globe2, label: 'Đánh giá', value: `${mentor.reviewCount.toLocaleString('vi-VN')} lượt` },
                        { icon: Building2, label: 'Công ty', value: mentor.currentCompany || 'Chưa cập nhật' },
                        { icon: GraduationCap, label: 'Trường học', value: mentor.currentSchool || 'Không công khai' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                            <item.icon size={18} className="mt-0.5 text-primary shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="mt-0.5 text-sm font-medium text-foreground">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Expertise Tags */}
            {mentor.expertise.length > 0 && (
                <div className="rounded-[28px] border border-border/60 bg-background p-6 sm:p-8">
                    <h3 className="text-xl font-bold text-foreground mb-4">Chuyên môn</h3>
                    <div className="flex flex-wrap gap-2">
                        {mentor.expertise.map((item) => (
                            <Badge key={item} variant="outline" className="border-border/70 bg-background px-3 py-1.5 text-sm">
                                {item}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MentorPreview() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.dashboard,
        queryFn: mentorApi.getDashboard,
    });

    const mentor = data?.mentor;

    if (isLoading) {
        return (
            <div className="flex h-[420px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !mentor) {
        return (
            <div className="p-8">
                <EmptyState
                    icon={<UserRound size={28} />}
                    title="Không thể tải hồ sơ"
                    description={getErrorMessage(error, 'Phiên mentor chưa sẵn sàng.')}
                />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Xem trước hồ sơ — Mentor Portal — IT Compass</title>
            </Helmet>

            <div className="p-6 sm:p-8 lg:p-10 space-y-6">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mentor Portal</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Xem trước hồ sơ</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Device Toggle */}
                        <div className="flex rounded-xl border border-border/70 bg-secondary/30 p-1">
                            <button
                                onClick={() => setViewMode('desktop')}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                    viewMode === 'desktop'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Monitor size={14} /> Desktop
                            </button>
                            <button
                                onClick={() => setViewMode('mobile')}
                                className={cn(
                                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                    viewMode === 'mobile'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Smartphone size={14} /> Mobile
                            </button>
                        </div>

                        <Button onClick={() => navigate('/mentor/profile')} variant="outline" className="gap-2">
                            <UserPen size={16} /> Chỉnh sửa
                        </Button>
                    </div>
                </motion.div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05, ease: EASE }}
                    className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3"
                >
                    <Eye size={18} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">
                        Đây là cách học viên nhìn thấy profile của bạn trên trang Mentor.
                    </p>
                </motion.div>

                {/* Preview Content */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
                    className={cn(
                        'mx-auto transition-all duration-300',
                        viewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl',
                    )}
                >
                    <ProfileCard mentor={mentor} />
                </motion.div>
            </div>
        </>
    );
}
