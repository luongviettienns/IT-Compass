import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
    BadgeCheck,
    Briefcase,
    Clock3,
    Globe2,
    GraduationCap,
    Save,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../../lib/mentorApi';
import { mentorQueryKeys } from '../../lib/mentorQueryKeys';
import { getErrorMessage } from '../../lib/appError';
import { cn } from '../../lib/utils';

const LEVEL_OPTIONS = [
    { value: '', label: 'Chọn level' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MIDDLE', label: 'Middle' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'ARCHITECT', label: 'Architect' },
    { value: 'MANAGER', label: 'Manager' },
] as const;

const STATUS_LABELS = {
    ACTIVE: 'Đang nhận tư vấn',
    PAUSED: 'Tạm dừng',
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

export default function MentorDashboard() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: '',
        slug: '',
        title: '',
        bio: '',
        level: '',
        expertiseArea: '',
        yearsOfExperience: '',
        hourlyRate: '',
        currentSchool: '',
        currentCompany: '',
        currentJobTitle: '',
        consultationLang: '',
        avatarUrl: '',
    });

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.dashboard,
        queryFn: mentorApi.getDashboard,
    });

    const mentor = data?.mentor;
    const stats = data?.stats;

    useEffect(() => {
        if (!mentor) return;
        setForm({
            name: mentor.name || '',
            slug: mentor.slug || '',
            title: mentor.title || '',
            bio: mentor.bio || '',
            level: mentor.level || '',
            expertiseArea: mentor.expertiseArea || '',
            yearsOfExperience: mentor.yearsOfExperience != null ? String(mentor.yearsOfExperience) : '',
            hourlyRate: mentor.hourlyRate != null ? String(mentor.hourlyRate) : '',
            currentSchool: mentor.currentSchool || '',
            currentCompany: mentor.currentCompany || '',
            currentJobTitle: mentor.currentJobTitle || '',
            consultationLang: mentor.consultationLang || '',
            avatarUrl: mentor.avatarUrl || '',
        });
    }, [mentor]);

    const updateMutation = useMutation({
        mutationFn: () =>
            mentorApi.updateProfile({
                name: form.name.trim() || undefined,
                slug: form.slug.trim() || undefined,
                title: form.title.trim() || null,
                bio: form.bio.trim() || null,
                level: (form.level || null) as Parameters<typeof mentorApi.updateProfile>[0]['level'],
                expertiseArea: form.expertiseArea.trim() || null,
                yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : null,
                hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
                currentSchool: form.currentSchool.trim() || null,
                currentCompany: form.currentCompany.trim() || null,
                currentJobTitle: form.currentJobTitle.trim() || null,
                consultationLang: form.consultationLang.trim() || null,
                avatarUrl: form.avatarUrl.trim() || null,
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: mentorQueryKeys.dashboard });
            await queryClient.invalidateQueries({ queryKey: mentorQueryKeys.profile });
            toast.success('Đã cập nhật hồ sơ mentor.');
        },
        onError: (mutationError) => {
            toast.error(getErrorMessage(mutationError, 'Không thể cập nhật hồ sơ mentor.'));
        },
    });

    const completionTone = stats?.profileCompletion && stats.profileCompletion >= 80
        ? 'text-emerald-600'
        : stats?.profileCompletion && stats.profileCompletion >= 50
            ? 'text-amber-500'
            : 'text-primary';

    const quickFacts = mentor
        ? [
            {
                icon: Clock3,
                label: 'Kinh nghiệm',
                value: mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : 'Đang cập nhật',
            },
            {
                icon: Briefcase,
                label: 'Chi phí',
                value: formatMentorHourlyRate(mentor.hourlyRate),
            },
            {
                icon: Globe2,
                label: 'Ngôn ngữ tư vấn',
                value: mentor.consultationLang || 'Việt / English',
            },
            {
                icon: GraduationCap,
                label: 'Nơi đang học / làm',
                value: mentor.currentCompany || mentor.currentSchool || 'Đang cập nhật',
            },
        ]
        : [];

    if (isLoading) {
        return <div className="flex h-[420px] items-center justify-center"><Loader /></div>;
    }

    if (error || !mentor || !stats) {
        return (
            <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                <EmptyState
                    icon={<UserRound size={28} />}
                    title="Không thể tải bảng điều khiển mentor"
                    description={getErrorMessage(error, 'Phiên mentor hiện chưa sẵn sàng hoặc dữ liệu chưa được thiết lập.')}
                />
            </main>
        );
    }

    return (
        <>
            <Helmet>
                <title>Mentor Dashboard — IT Compass</title>
                <meta
                    name="description"
                    content="Quản lý hồ sơ mentor, theo dõi mức độ hoàn thiện và cập nhật các thông tin hiển thị công khai trên IT Compass."
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
                <section className="rounded-[32px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.12),transparent_24%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] p-6 sm:p-8 lg:p-10">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end"
                    >
                        <div>
                            <Badge variant="outline" className="border-primary/20 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-primary">
                                Mentor workspace
                            </Badge>
                            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                                <Avatar src={mentor.avatarUrl} alt={mentor.name} size="xl" className="ring-4 ring-primary/10" />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                                            {mentor.name}
                                        </h1>
                                        {stats.isVerified && <BadgeCheck className="text-primary" size={20} />}
                                    </div>
                                    <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                                        {getMentorHeadline(mentor)}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Badge variant="secondary" className="border border-border/60 bg-background/80 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-foreground">
                                            {mentor.level || 'LEVEL CHƯA CẬP NHẬT'}
                                        </Badge>
                                        <Badge variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-primary">
                                            {STATUS_LABELS[stats.status]}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-border/70 bg-background/85 p-6 shadow-xl shadow-primary/5 backdrop-blur">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Tình trạng hồ sơ</p>
                            <div className="mt-5 space-y-5">
                                <div>
                                    <div className="flex items-end justify-between gap-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mức độ hoàn thiện</p>
                                            <p className={cn('mt-1 text-4xl font-black', completionTone)}>{stats.profileCompletion}%</p>
                                        </div>
                                        <div className="text-right text-sm text-muted-foreground">
                                            <p>{stats.reviewCount.toLocaleString('vi-VN')} lượt đánh giá</p>
                                            <p>{stats.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-primary transition-[width] duration-500"
                                            style={{ width: `${Math.max(0, Math.min(stats.profileCompletion, 100))}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    Hồ sơ càng đầy đủ, mentor càng dễ được hiển thị đúng ngữ cảnh cho người học đang cần kết nối trong lĩnh vực của bạn.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
                        className="rounded-[32px] border border-border/70 bg-background p-6 sm:p-8"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Thông tin công khai</p>
                                <h2 className="mt-2 text-2xl font-bold text-foreground">Cập nhật hồ sơ mentor</h2>
                            </div>
                            <Button onClick={() => updateMutation.mutate()} isLoading={updateMutation.isPending} className="gap-2">
                                <Save size={16} /> Lưu thay đổi
                            </Button>
                        </div>

                        <div className="mt-8 grid gap-5 sm:grid-cols-2">
                            <Input label="Tên hiển thị" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                            <Input label="Slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
                            <Input label="Headline / Title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
                            <Input label="Chuyên môn chính" value={form.expertiseArea} onChange={(event) => setForm((prev) => ({ ...prev, expertiseArea: event.target.value }))} />
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium text-foreground">Level</span>
                                <select
                                    value={form.level}
                                    onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                >
                                    {LEVEL_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </label>
                            <Input label="Ngôn ngữ tư vấn" value={form.consultationLang} onChange={(event) => setForm((prev) => ({ ...prev, consultationLang: event.target.value }))} />
                            <Input type="number" label="Số năm kinh nghiệm" value={form.yearsOfExperience} onChange={(event) => setForm((prev) => ({ ...prev, yearsOfExperience: event.target.value }))} />
                            <Input type="number" label="Chi phí theo giờ" value={form.hourlyRate} onChange={(event) => setForm((prev) => ({ ...prev, hourlyRate: event.target.value }))} />
                            <Input label="Công ty hiện tại" value={form.currentCompany} onChange={(event) => setForm((prev) => ({ ...prev, currentCompany: event.target.value }))} />
                            <Input label="Job title hiện tại" value={form.currentJobTitle} onChange={(event) => setForm((prev) => ({ ...prev, currentJobTitle: event.target.value }))} />
                            <Input label="Trường học" value={form.currentSchool} onChange={(event) => setForm((prev) => ({ ...prev, currentSchool: event.target.value }))} />
                            <Input label="Avatar URL" value={form.avatarUrl} onChange={(event) => setForm((prev) => ({ ...prev, avatarUrl: event.target.value }))} />
                        </div>

                        <div className="mt-5">
                            <label className="space-y-1.5">
                                <span className="text-sm font-medium text-foreground">Bio</span>
                                <textarea
                                    value={form.bio}
                                    onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
                                    rows={6}
                                    className="flex w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                    placeholder="Giới thiệu ngắn về kinh nghiệm, thế mạnh và kiểu vấn đề bạn có thể hỗ trợ mentee."
                                />
                            </label>
                        </div>
                    </motion.section>

                    <motion.aside
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1, ease: EASE }}
                        className="space-y-6"
                    >
                        <div className="rounded-[32px] border border-border/70 bg-background p-6 shadow-sm">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Snapshot hiển thị</p>
                            <div className="mt-5 flex items-center gap-4">
                                <Avatar src={form.avatarUrl || mentor.avatarUrl} alt={form.name || mentor.name} size="lg" className="ring-4 ring-primary/10" />
                                <div className="min-w-0">
                                    <h3 className="truncate text-xl font-bold text-foreground">{form.name || mentor.name}</h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        {form.title || getMentorHeadline(mentor)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-border/70 bg-surface/50 px-3 py-1 text-xs text-foreground/80">
                                    {form.expertiseArea || mentor.expertiseArea || 'Chuyên môn đang cập nhật'}
                                </Badge>
                                <Badge variant="outline" className="border-border/70 bg-surface/50 px-3 py-1 text-xs text-foreground/80">
                                    {form.level || mentor.level || 'Level chưa cập nhật'}
                                </Badge>
                            </div>
                            <p className="mt-5 text-sm leading-7 text-muted-foreground">
                                {form.bio || mentor.bio || 'Phần bio của mentor sẽ xuất hiện tại đây sau khi được cập nhật.'}
                            </p>
                        </div>

                        <div className="rounded-[32px] border border-primary/15 bg-primary/5 p-6 shadow-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                <Sparkles size={22} />
                            </div>
                            <h3 className="mt-5 text-2xl font-bold text-foreground">Các thông tin nên ưu tiên</h3>
                            <div className="mt-4 space-y-3">
                                {quickFacts.map((item) => (
                                    <div key={item.label} className="rounded-2xl border border-border/60 bg-background/80 px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <item.icon size={18} className="mt-0.5 text-primary" />
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                                                <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.aside>
                </section>
            </main>
        </>
    );
}
