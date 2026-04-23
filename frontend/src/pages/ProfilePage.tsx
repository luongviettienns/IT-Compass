import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import {
    ArrowRight,
    BadgeCheck,
    BookOpen,
    Camera,
    GraduationCap,
    ImageUp,
    Link2,
    MapPin,
    Phone,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, buttonVariants } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { toApiAssetUrl, type AuthUser, type Gender } from '../lib/authApi';
import { getErrorMessage } from '../lib/appError';
import { assessmentApi } from '../lib/assessmentApi';
import { assessmentQueryKeys } from '../lib/assessmentQueryKeys';
import { mentorApi, formatMentorHourlyRate, getMentorHeadline } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { getRoleBadge } from '../lib/userDisplay';
import { userApi } from '../lib/userApi';
import { cn } from '../lib/utils';

type ProfileFormState = {
    fullName: string;
    avatarUrl: string;
    coverImageUrl: string;
    phoneNumber: string;
    location: string;
    birthYear: string;
    gender: '' | Gender;
    province: string;
    schoolOrCompany: string;
    department: string;
    bio: string;
    githubUrl: string;
    linkedinUrl: string;
    jobTitle: string;
};

const HISTORY_LIMIT = 5;
const RECOMMENDED_LIMIT = 3;

const inputClassName =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
const textAreaClassName =
    'flex min-h-[132px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const formatDateTime = (value: string | null | undefined) => {
    if (!value) return 'Chưa có dữ liệu';
    return new Date(value).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const normalizeNullable = (value: string) => {
    const normalized = value.trim();
    return normalized ? normalized : null;
};

const createFormState = (user: AuthUser): ProfileFormState => ({
    fullName: user.fullName ?? '',
    avatarUrl: user.profile?.avatarUrl ?? '',
    coverImageUrl: user.profile?.coverImageUrl ?? '',
    phoneNumber: user.profile?.phoneNumber ?? '',
    location: user.profile?.location ?? '',
    birthYear: user.profile?.birthYear ? String(user.profile.birthYear) : '',
    gender: user.profile?.gender ?? '',
    province: user.profile?.province ?? '',
    schoolOrCompany: user.profile?.schoolOrCompany ?? '',
    department: user.profile?.department ?? '',
    bio: user.profile?.bio ?? '',
    githubUrl: user.profile?.githubUrl ?? '',
    linkedinUrl: user.profile?.linkedinUrl ?? '',
    jobTitle: user.profile?.jobTitle ?? '',
});

function ProfileSkeleton() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
            <div className="space-y-8">
                <Skeleton className="h-72 rounded-[36px]" />
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]">
                    <Skeleton className="h-[760px] rounded-[32px]" />
                    <div className="space-y-6">
                        <Skeleton className="h-56 rounded-[32px]" />
                        <Skeleton className="h-72 rounded-[32px]" />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [form, setForm] = useState<ProfileFormState | null>(user ? createFormState(user) : null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingTarget, setUploadingTarget] = useState<'avatar' | 'cover' | null>(null);

    useEffect(() => {
        if (user) {
            setForm(createFormState(user));
        }
    }, [user]);

    const latestAttemptQuery = useQuery({
        queryKey: assessmentQueryKeys.latestAttempt,
        queryFn: () => assessmentApi.getLatestAttempt(),
        initialData: user?.assessment ? { attempt: user.assessment.latestAttempt } : undefined,
    });

    const historyQuery = useQuery({
        queryKey: assessmentQueryKeys.history(1, HISTORY_LIMIT),
        queryFn: () => assessmentApi.getHistory(1, HISTORY_LIMIT),
    });

    const recommendedMentorsQuery = useQuery({
        queryKey: mentorQueryKeys.recommended(RECOMMENDED_LIMIT),
        queryFn: () => mentorApi.getRecommended(RECOMMENDED_LIMIT),
        enabled: user?.role === 'STUDENT',
    });

    const roleBadge = useMemo(() => getRoleBadge(user?.role), [user?.role]);
    const latestAttempt = latestAttemptQuery.data?.attempt ?? null;
    const history = historyQuery.data?.attempts ?? [];
    const recommendations = recommendedMentorsQuery.data?.mentors ?? [];
    const matchedExpertise = recommendedMentorsQuery.data?.matchedExpertise ?? [];
    const coverImage = toApiAssetUrl(form?.coverImageUrl || user?.profile?.coverImageUrl);

    if (!user || !form) {
        return <ProfileSkeleton />;
    }

    const handleFieldChange = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
        setForm((current) => (current ? { ...current, [field]: value } : current));
    };

    const applyUserResponse = async (nextUser: AuthUser) => {
        setForm(createFormState(nextUser));
        await refreshUser();
    };

    const handleSaveProfile = async () => {
        setFormError(null);

        if (form.fullName.trim().length < 2) {
            setFormError('Họ và tên cần có ít nhất 2 ký tự.');
            return;
        }

        const birthYear = form.birthYear.trim() ? Number(form.birthYear) : null;
        if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear())) {
            setFormError('Năm sinh không hợp lệ.');
            return;
        }

        setIsSaving(true);
        try {
            const result = await userApi.updateProfile({
                fullName: form.fullName.trim(),
                avatarUrl: normalizeNullable(form.avatarUrl),
                coverImageUrl: normalizeNullable(form.coverImageUrl),
                phoneNumber: normalizeNullable(form.phoneNumber),
                location: normalizeNullable(form.location),
                birthYear,
                gender: form.gender || null,
                province: normalizeNullable(form.province),
                schoolOrCompany: normalizeNullable(form.schoolOrCompany),
                department: normalizeNullable(form.department),
                bio: normalizeNullable(form.bio),
                githubUrl: normalizeNullable(form.githubUrl),
                linkedinUrl: normalizeNullable(form.linkedinUrl),
                jobTitle: normalizeNullable(form.jobTitle),
            });

            await applyUserResponse(result.user);
            toast.success('Đã cập nhật hồ sơ cá nhân.');
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể cập nhật hồ sơ lúc này.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleAssetUpload = async (field: 'avatarUrl' | 'coverImageUrl', target: 'avatar' | 'cover', file: File | null) => {
        if (!file) return;

        setFormError(null);
        setUploadingTarget(target);
        try {
            const uploaded = await userApi.uploadImage(file);
            const result = await userApi.updateProfile({ [field]: uploaded.url });
            await applyUserResponse(result.user);
            toast.success(target === 'avatar' ? 'Đã cập nhật ảnh đại diện.' : 'Đã cập nhật ảnh bìa.');
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể tải ảnh lên lúc này.'));
        } finally {
            setUploadingTarget(null);
        }
    };

    const handleAssetClear = async (field: 'avatarUrl' | 'coverImageUrl', target: 'avatar' | 'cover') => {
        setFormError(null);
        setUploadingTarget(target);
        try {
            const result = await userApi.updateProfile({ [field]: null });
            await applyUserResponse(result.user);
            toast.success(target === 'avatar' ? 'Đã gỡ ảnh đại diện.' : 'Đã gỡ ảnh bìa.');
        } catch (error) {
            setFormError(getErrorMessage(error, 'Không thể cập nhật ảnh lúc này.'));
        } finally {
            setUploadingTarget(null);
        }
    };

    return (
        <>
            <Helmet>
                <title>Hồ sơ cá nhân — IT Compass</title>
                <meta
                    name="description"
                    content="Quản lý hồ sơ cá nhân IT Compass, cập nhật thông tin học tập, xem lịch sử assessment và các mentor được gợi ý từ kết quả mới nhất."
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                <div className="space-y-8">
                    <section className="relative overflow-hidden rounded-[36px] border border-border/60 bg-background shadow-lg shadow-primary/5">
                        <div
                            className="h-44 w-full bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_26%),linear-gradient(135deg,#0f172a,#1e293b_45%,#2563eb)] bg-cover bg-center"
                            style={coverImage ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.38), rgba(15,23,42,0.38)), url(${coverImage})` } : undefined}
                        />
                        <div className="relative px-6 pb-6 sm:px-8 lg:px-10">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                    <div className="-mt-16 sm:-mt-20 shrink-0">
                                        <Avatar src={form.avatarUrl || user.profile?.avatarUrl} alt={user.fullName} size="xl" className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background bg-background shadow-lg shadow-primary/10" />
                                    </div>
                                    <div className="space-y-3 pt-2 sm:pt-0 sm:pb-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {roleBadge && <Badge className={roleBadge.color}>{roleBadge.label}</Badge>}
                                            <Badge variant="outline" className="border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
                                                {user.status}
                                            </Badge>
                                            {user.emailVerifiedAt ? (
                                                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    Email đã xác minh
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                                                    Email chưa xác minh
                                                </Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{user.fullName}</h1>
                                            <p className="mt-1 text-sm font-medium text-muted-foreground">{user.email}</p>
                                            {form.bio && (
                                                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                                                    {form.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
                                        {uploadingTarget === 'cover' ? 'Đang tải ảnh bìa...' : 'Tải ảnh bìa'} <ImageUp size={16} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event) => {
                                                const file = event.currentTarget.files?.[0] ?? null;
                                                void handleAssetUpload('coverImageUrl', 'cover', file);
                                                event.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                    <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
                                        {uploadingTarget === 'avatar' ? 'Đang tải ảnh đại diện...' : 'Tải ảnh đại diện'} <Camera size={16} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="sr-only"
                                            onChange={(event) => {
                                                const file = event.currentTarget.files?.[0] ?? null;
                                                void handleAssetUpload('avatarUrl', 'avatar', file);
                                                event.currentTarget.value = '';
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px] xl:items-start">
                        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                            <Card className="rounded-[32px] border-border/70 shadow-xl shadow-primary/5">
                                <CardHeader className="space-y-3">
                                    <CardTitle className="text-3xl font-black tracking-tight">Thông tin hồ sơ</CardTitle>
                                    <CardDescription className="text-sm leading-6">
                                        Cập nhật thông tin nền tảng để kết quả định hướng và mentor recommendation sát hơn với mục tiêu hiện tại của bạn.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                                            <UserRound size={16} /> Nhận diện cá nhân
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Input
                                                label="Họ và tên"
                                                value={form.fullName}
                                                onChange={(event) => handleFieldChange('fullName', event.target.value)}
                                            />
                                            <Input label="Email" value={user.email} disabled />
                                            <Input
                                                label="Chức danh hiện tại"
                                                value={form.jobTitle}
                                                onChange={(event) => handleFieldChange('jobTitle', event.target.value)}
                                            />
                                            <Input
                                                label="Số điện thoại"
                                                value={form.phoneNumber}
                                                onChange={(event) => handleFieldChange('phoneNumber', event.target.value)}
                                                icon={<Phone size={16} />}
                                            />
                                            <Input
                                                label="Địa điểm"
                                                value={form.location}
                                                onChange={(event) => handleFieldChange('location', event.target.value)}
                                                icon={<MapPin size={16} />}
                                            />
                                            <Input
                                                label="Tỉnh / thành"
                                                value={form.province}
                                                onChange={(event) => handleFieldChange('province', event.target.value)}
                                            />
                                            <Input
                                                label="Năm sinh"
                                                type="number"
                                                value={form.birthYear}
                                                onChange={(event) => handleFieldChange('birthYear', event.target.value)}
                                            />
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-foreground">Giới tính</label>
                                                <select
                                                    className={inputClassName}
                                                    value={form.gender}
                                                    onChange={(event) => handleFieldChange('gender', event.target.value as '' | Gender)}
                                                >
                                                    <option value="">Chưa chọn</option>
                                                    <option value="MALE">Nam</option>
                                                    <option value="FEMALE">Nữ</option>
                                                    <option value="OTHER">Khác</option>
                                                </select>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                                            <GraduationCap size={16} /> Học tập & công việc
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Input
                                                label="Trường học / công ty"
                                                value={form.schoolOrCompany}
                                                onChange={(event) => handleFieldChange('schoolOrCompany', event.target.value)}
                                            />
                                            <Input
                                                label="Khoa / bộ phận"
                                                value={form.department}
                                                onChange={(event) => handleFieldChange('department', event.target.value)}
                                            />
                                            <Input
                                                label="GitHub URL"
                                                type="url"
                                                value={form.githubUrl}
                                                onChange={(event) => handleFieldChange('githubUrl', event.target.value)}
                                                icon={<Link2 size={16} />}
                                            />
                                            <Input
                                                label="LinkedIn URL"
                                                type="url"
                                                value={form.linkedinUrl}
                                                onChange={(event) => handleFieldChange('linkedinUrl', event.target.value)}
                                                icon={<Link2 size={16} />}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-foreground">Giới thiệu ngắn</label>
                                            <textarea
                                                className={textAreaClassName}
                                                placeholder="Bạn đang học gì, quan tâm mảng nào, muốn phát triển ra sao..."
                                                value={form.bio}
                                                onChange={(event) => handleFieldChange('bio', event.target.value)}
                                            />
                                        </div>
                                    </section>

                                    {formError && (
                                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                            {formError}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap gap-3">
                                            <Button type="button" size="lg" onClick={() => void handleSaveProfile()} isLoading={isSaving}>
                                                Lưu thay đổi <ArrowRight size={16} />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="lg"
                                                disabled={!form.avatarUrl && !form.coverImageUrl}
                                                onClick={() => {
                                                    if (form.avatarUrl) {
                                                        void handleAssetClear('avatarUrl', 'avatar');
                                                    }
                                                    if (form.coverImageUrl) {
                                                        void handleAssetClear('coverImageUrl', 'cover');
                                                    }
                                                }}
                                            >
                                                Gỡ toàn bộ ảnh
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Cập nhật lần gần nhất: <span className="font-medium text-foreground">{formatDateTime(user.updatedAt ?? user.emailVerifiedAt)}</span>
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.section>

                        <div className="space-y-6">
                            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.04 }}>
                                <Card className="rounded-[32px] border-border/70 shadow-xl shadow-primary/5">
                                    <CardHeader className="space-y-3">
                                        <CardTitle className="text-2xl font-black tracking-tight">Assessment snapshot</CardTitle>
                                        <CardDescription className="text-sm leading-6">
                                            Tóm tắt nhanh kết quả gần nhất để nối tiếp sang mentor và lộ trình học phù hợp.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {latestAttemptQuery.isLoading ? (
                                            <div className="space-y-3">
                                                <Skeleton className="h-10 w-40 rounded-full" />
                                                <Skeleton className="h-8 w-48" />
                                                <Skeleton className="h-20 w-full rounded-[24px]" />
                                            </div>
                                        ) : latestAttemptQuery.error ? (
                                            <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                                                {getErrorMessage(latestAttemptQuery.error, 'Không thể tải kết quả assessment gần nhất.')}
                                            </div>
                                        ) : latestAttempt ? (
                                            <div className="space-y-4">
                                                <Badge variant="outline" className="border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                                                    {latestAttempt.resultCode} · {latestAttempt.summary.title}
                                                </Badge>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Hoàn tất lúc</p>
                                                    <p className="mt-1 font-medium text-foreground">{formatDateTime(latestAttempt.submittedAt)}</p>
                                                </div>
                                                <p className="text-sm leading-6 text-muted-foreground">{latestAttempt.summary.headline}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {latestAttempt.summary.topTraits.map((trait) => (
                                                        <Badge key={trait} variant="secondary" className="px-3 py-1 text-xs">
                                                            {trait}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <Link to="/test/result" className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}>
                                                    Xem kết quả đầy đủ
                                                </Link>
                                            </div>
                                        ) : (
                                            <EmptyState
                                                icon={<Sparkles size={24} />}
                                                title="Chưa có kết quả assessment"
                                                description="Làm bài trắc nghiệm đầu tiên để mở khóa gợi ý mentor và chuyên ngành phù hợp."
                                                action={
                                                    <Link to="/test" className={buttonVariants({ variant: 'outline' })}>
                                                        Bắt đầu assessment
                                                    </Link>
                                                }
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.section>

                            <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
                                <Card className="rounded-[32px] border-border/70 shadow-xl shadow-primary/5">
                                    <CardHeader className="space-y-3">
                                        <CardTitle className="text-2xl font-black tracking-tight">Lịch sử assessment</CardTitle>
                                        <CardDescription className="text-sm leading-6">
                                            Các lượt làm gần đây để bạn so sánh xu hướng và kiểm tra mức ổn định của kết quả.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {historyQuery.isLoading ? (
                                            <div className="space-y-3">
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <Skeleton key={index} className="h-20 rounded-[24px]" />
                                                ))}
                                            </div>
                                        ) : historyQuery.error ? (
                                            <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                                                {getErrorMessage(historyQuery.error, 'Không thể tải lịch sử assessment.')}
                                            </div>
                                        ) : history.length ? (
                                            <div className="space-y-3">
                                                {history.map((attempt, index) => (
                                                    <article key={attempt.id} className="rounded-[24px] border border-border/60 bg-background p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lần #{index + 1}</p>
                                                                <h3 className="mt-2 text-base font-semibold text-foreground">{attempt.summary.title}</h3>
                                                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{attempt.summary.headline}</p>
                                                            </div>
                                                            <Badge variant="outline" className="border-border/70 bg-surface/55 px-3 py-1 text-xs">
                                                                {attempt.resultCode}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
                                                            <span>{formatDateTime(attempt.submittedAt)}</span>
                                                            <span>{attempt.quizVersion}</span>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState
                                                icon={<BookOpen size={24} />}
                                                title="Chưa có lịch sử assessment"
                                                description="Sau khi nộp bài, các lượt làm gần nhất sẽ xuất hiện ở đây."
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.section>
                        </div>
                    </div>

                    {user.role === 'STUDENT' && (
                        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }}>
                            <Card className="rounded-[32px] border-border/70 shadow-xl shadow-primary/5">
                                <CardHeader className="space-y-3">
                                    <CardTitle className="text-3xl font-black tracking-tight">Mentor recommendation</CardTitle>
                                    <CardDescription className="text-sm leading-6">
                                        Gợi ý mentor được suy ra từ kết quả assessment gần nhất để bạn chuyển ngay sang bước hành động.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {recommendedMentorsQuery.isLoading ? (
                                        <div className="grid gap-4 lg:grid-cols-3">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <Skeleton key={index} className="h-52 rounded-[24px]" />
                                            ))}
                                        </div>
                                    ) : recommendedMentorsQuery.error ? (
                                        <div className="rounded-[24px] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                                            {getErrorMessage(recommendedMentorsQuery.error, 'Không thể tải mentor gợi ý lúc này.')}
                                        </div>
                                    ) : recommendations.length ? (
                                        <>
                                            <div className="flex flex-wrap gap-2">
                                                {matchedExpertise.map((tag) => (
                                                    <Badge key={tag} variant="outline" className="border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="grid gap-4 lg:grid-cols-3">
                                                {recommendations.map((mentor) => (
                                                    <article key={mentor.id} className="rounded-[24px] border border-border/60 bg-background p-5">
                                                        <div className="flex items-start gap-4">
                                                            <Avatar src={mentor.avatarUrl} alt={mentor.name} size="lg" />
                                                            <div className="min-w-0">
                                                                <h3 className="text-base font-semibold text-foreground">{mentor.name}</h3>
                                                                <p className="mt-1 text-sm text-muted-foreground">{getMentorHeadline(mentor)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                                            <p>{mentor.expertiseArea || 'Chưa cập nhật chuyên môn chính'}</p>
                                                            <p>{formatMentorHourlyRate(mentor.hourlyRate)} / buổi</p>
                                                            <p>{mentor.reviewCount} đánh giá</p>
                                                        </div>
                                                        <Link
                                                            to={`/mentors/${mentor.slug}`}
                                                            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5 w-full justify-center')}
                                                        >
                                                            Xem hồ sơ mentor
                                                        </Link>
                                                    </article>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <EmptyState
                                            icon={<BadgeCheck size={24} />}
                                            title="Chưa có mentor recommendation"
                                            description="Hoàn thiện assessment hoặc cập nhật hồ sơ để hệ thống đề xuất mentor phù hợp hơn."
                                            action={
                                                <Link to="/mentors" className={buttonVariants({ variant: 'outline' })}>
                                                    Xem toàn bộ mentor
                                                </Link>
                                            }
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </motion.section>
                    )}
                </div>
            </main>
        </>
    );
}
