import { useQuery } from '@tanstack/react-query';
import { adminUserApi } from '../../lib/adminUserApi';
import { adminMentorApi } from '../../lib/adminMentorApi';
import { blogApi } from '../../lib/blogApi';
import { assessmentApi } from '../../lib/assessmentApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { Users, UserCheck, FileText, ClipboardList, ShieldCheck, UserX, Eye, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
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
        { label: 'Tổng người dùng', value: userStats?.stats?.total || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Tổng Mentor', value: mentorList?.summary?.total || 0, icon: UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Tổng bài viết', value: blogStats?.stats?.total || 0, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Lượt Assessment', value: assessmentStats?.stats?.totalAttempts || 0, icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Tổng quan hệ thống</h1>
                <p className="text-sm text-muted-foreground">Theo dõi các chỉ số quan trọng của IT Compass.</p>
            </div>

            {/* Main Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border bg-background p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </div>
                        <h3 className={`mt-2 text-3xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</h3>
                    </div>
                ))}
            </div>

            {/* Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* User breakdown */}
                <div className="rounded-2xl border bg-background p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Người dùng</h3>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="flex items-center gap-2 text-sm"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Hoạt động</span>
                        <span className="font-bold">{userStats?.stats?.byStatus?.active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="flex items-center gap-2 text-sm"><UserX className="w-3.5 h-3.5 text-destructive" /> Bị khóa</span>
                        <span className="font-bold">{userStats?.stats?.byStatus?.blocked || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2 text-sm"><Eye className="w-3.5 h-3.5 text-amber-500" /> Đã xác minh email</span>
                        <span className="font-bold">{userStats?.stats?.verification?.verified || 0}</span>
                    </div>
                </div>

                {/* Blog breakdown */}
                <div className="rounded-2xl border bg-background p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Nội dung (Blog)</h3>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="text-sm">Đã xuất bản</span>
                        <span className="font-bold text-emerald-500">{blogStats?.stats?.published || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="text-sm">Bản nháp</span>
                        <span className="font-bold text-amber-500">{blogStats?.stats?.draft || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="text-sm">Lên lịch đăng</span>
                        <span className="font-bold text-indigo-500">{blogStats?.stats?.scheduled || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2 text-sm"><MessageSquare className="w-3.5 h-3.5" /> Bình luận</span>
                        <span className="font-bold">{blogStats?.stats?.totalComments || 0}</span>
                    </div>
                </div>

                {/* Mentor breakdown */}
                <div className="rounded-2xl border bg-background p-5 shadow-sm space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mentor</h3>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="text-sm">Hoạt động</span>
                        <span className="font-bold text-emerald-500">{mentorList?.summary?.active || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-dashed">
                        <span className="text-sm">Tạm dừng</span>
                        <span className="font-bold text-amber-500">{mentorList?.summary?.paused || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm">Đã xác thực</span>
                        <span className="font-bold text-primary">{mentorList?.summary?.verified || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
