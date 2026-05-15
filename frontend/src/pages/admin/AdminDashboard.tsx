/**
 * @file AdminDashboard.tsx - Tổng quan hệ thống Admin Portal.
 *
 * Welcome banner, animated stat cards, breakdown grids, quick actions.
 */

import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
    Users,
    UserCheck,
    FileText,
    ClipboardList,
    ShieldCheck,
    UserX,
    Eye,
    MessageSquare,
    ArrowRight,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { adminUserApi } from '../../lib/adminUserApi';
import { adminMentorApi } from '../../lib/adminMentorApi';
import { blogApi } from '../../lib/blogApi';
import { assessmentApi } from '../../lib/assessmentApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { useAuth } from '../../contexts/AuthContext';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function AdminDashboard() {
    const { user } = useAuth();

    const { data: userStats, isLoading: loadingUsers } = useQuery({
        queryKey: adminQueryKeys.userStats,
        queryFn: adminUserApi.getUserStats,
    });

    const { data: mentorList, isLoading: loadingMentors } = useQuery({
        queryKey: adminQueryKeys.mentors({ limit: 1 }),
        queryFn: () => adminMentorApi.listMentors({ limit: 1 }),
    });

    const { data: blogStats, isLoading: loadingBlogs } = useQuery({
        queryKey: adminQueryKeys.blogStats,
        queryFn: blogApi.adminStats,
    });

    const { data: assessmentStats, isLoading: loadingAssessments } = useQuery({
        queryKey: adminQueryKeys.assessmentStats,
        queryFn: assessmentApi.getAdminStats,
    });

    if (loadingUsers || loadingMentors || loadingBlogs || loadingAssessments) {
        return <div className="flex h-[400px] items-center justify-center"><Loader /></div>;
    }

    const statCards = [
        { label: 'Tổng người dùng', value: userStats?.stats?.total || 0, icon: Users, color: 'blue' },
        { label: 'Tổng Mentor', value: mentorList?.summary?.total || 0, icon: UserCheck, color: 'indigo' },
        { label: 'Tổng bài viết', value: blogStats?.stats?.total || 0, icon: FileText, color: 'amber' },
        { label: 'Lượt Assessment', value: assessmentStats?.stats?.totalAttempts || 0, icon: ClipboardList, color: 'emerald' },
    ];

    const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', iconBg: 'bg-blue-500/10' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', iconBg: 'bg-indigo-500/10' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', iconBg: 'bg-amber-500/10' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', iconBg: 'bg-emerald-500/10' },
    };

    const quickActions = [
        { label: 'Quản lý người dùng', href: '/admin/users', icon: Users, desc: 'Phân quyền, khóa tài khoản' },
        { label: 'Duyệt nội dung', href: '/admin/blogs', icon: FileText, desc: 'Bài viết, bình luận' },
        { label: 'Xem nhật ký', href: '/admin/audit-logs', icon: ShieldCheck, desc: 'Theo dõi hành động' },
        { label: 'Thống kê Assessment', href: '/admin/assessments', icon: TrendingUp, desc: 'Phân tích kết quả' },
    ];

    return (
        <>
            <Helmet>
                <title>Tổng quan — Admin Portal — IT Compass</title>
            </Helmet>

            <div className="space-y-8">
                {/* ── Welcome Banner ────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="relative overflow-hidden rounded-[28px] border border-border/60 bg-background p-6 sm:p-8"
                >
                    {/* Decorative */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.10),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(37,99,235,0.08),transparent_50%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                    <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-indigo-400/10 blur-3xl animate-pulse pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-blue-400/10 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                                        Chào, {user?.fullName || 'Admin'}!
                                    </h1>
                                    <p className="mt-1 text-base text-muted-foreground">
                                        Đây là tổng quan hệ thống IT Compass.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ── Main Stat Cards ───────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((stat, i) => {
                        const colors = colorMap[stat.color] || colorMap.blue;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                                className="group rounded-[24px] border border-border/60 bg-background p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.iconBg}`}>
                                        <stat.icon size={20} className={colors.text} />
                                    </div>
                                </div>
                                <h3 className={`mt-3 text-3xl font-black ${colors.text}`}>
                                    {stat.value.toLocaleString('vi-VN')}
                                </h3>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ── Detail Breakdown Grid ─────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* User breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
                        className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Người dùng</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="flex items-center gap-2 text-sm"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Hoạt động</span>
                                <span className="font-black text-emerald-600">{userStats?.stats?.byStatus?.active || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="flex items-center gap-2 text-sm"><UserX className="w-3.5 h-3.5 text-destructive" /> Bị khóa</span>
                                <span className="font-black text-destructive">{userStats?.stats?.byStatus?.blocked || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="flex items-center gap-2 text-sm"><Eye className="w-3.5 h-3.5 text-amber-500" /> Đã xác minh</span>
                                <span className="font-black text-amber-600">{userStats?.stats?.verification?.verified || 0}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Blog breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
                        className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <FileText size={16} className="text-amber-600" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Nội dung</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="text-sm">Đã xuất bản</span>
                                <span className="font-black text-emerald-600">{blogStats?.stats?.published || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="text-sm">Bản nháp</span>
                                <span className="font-black text-amber-600">{blogStats?.stats?.draft || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="text-sm">Lên lịch đăng</span>
                                <span className="font-black text-indigo-600">{blogStats?.stats?.scheduled || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="flex items-center gap-2 text-sm"><MessageSquare className="w-3.5 h-3.5" /> Bình luận</span>
                                <span className="font-black">{blogStats?.stats?.totalComments || 0}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mentor breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.35, ease: EASE }}
                        className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                                <UserCheck size={16} className="text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Mentor</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="text-sm">Hoạt động</span>
                                <span className="font-black text-emerald-600">{mentorList?.summary?.active || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-dashed">
                                <span className="text-sm">Tạm dừng</span>
                                <span className="font-black text-amber-600">{mentorList?.summary?.paused || 0}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm">Đã xác thực</span>
                                <span className="font-black text-blue-600">{mentorList?.summary?.verified || 0}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── Quick Actions ─────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
                >
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Truy cập nhanh</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                to={action.href}
                                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <action.icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground">{action.label}</p>
                                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                                </div>
                                <ArrowRight size={16} className="text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                            </Link>
                        ))}
                    </div>
                </motion.section>
            </div>
        </>
    );
}
