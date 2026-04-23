import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '../../lib/assessmentApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../../components/ui/Loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClipboardList, Users, TrendingUp, PieChart } from 'lucide-react';

export default function AdminAssessmentsPage() {
    const { data, isLoading } = useQuery({
        queryKey: adminQueryKeys.assessmentStats,
        queryFn: assessmentApi.getAdminStats,
    });

    const stats = data?.stats;
    const distributionData = stats?.resultDistribution?.map(item => ({
        name: item.resultCode,
        total: item.total,
    })) || [];

    const COLORS = [
        'hsl(221, 83%, 53%)', // blue
        'hsl(262, 83%, 58%)', // purple
        'hsl(142, 71%, 45%)', // green
        'hsl(38, 92%, 50%)',  // amber
        'hsl(0, 72%, 51%)',   // red
        'hsl(199, 89%, 48%)', // cyan
        'hsl(280, 65%, 60%)', // violet
    ];

    if (isLoading) {
        return <div className="flex h-[400px] items-center justify-center"><Loader /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Quản lý Assessment</h1>
                <p className="text-sm text-muted-foreground">
                    Thống kê và phân tích kết quả bài đánh giá thiên hướng nghề nghiệp.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tổng lượt làm</p>
                        <ClipboardList className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="mt-2 text-3xl font-black text-primary">{stats?.totalAttempts?.toLocaleString() || 0}</h3>
                </div>
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Học viên hoàn thành</p>
                        <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="mt-2 text-3xl font-black text-emerald-500">{stats?.completedUsers?.toLocaleString() || 0}</h3>
                </div>
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tỷ lệ hoàn thành</p>
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="mt-2 text-3xl font-black text-amber-500">{stats?.completionRate ? `${stats.completionRate.toFixed(1)}%` : '0%'}</h3>
                </div>
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loại kết quả</p>
                        <PieChart className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h3 className="mt-2 text-3xl font-black text-indigo-500">{distributionData.length}</h3>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Phân bố thiên hướng nghề nghiệp</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--secondary))' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                    {distributionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Table */}
                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Chi tiết phân bổ</h3>
                    <div className="space-y-3">
                        {distributionData.map((item, index) => {
                            const total = stats?.totalAttempts || 1;
                            const percent = ((item.total / total) * 100).toFixed(1);
                            return (
                                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="font-bold text-sm">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-mono font-bold">{item.total}</span>
                                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{percent}%</span>
                                    </div>
                                </div>
                            );
                        })}
                        {distributionData.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-8">Chưa có dữ liệu assessment.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
