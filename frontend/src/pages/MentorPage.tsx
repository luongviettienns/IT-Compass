import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Clock3,
    Filter,
    Search,
    SlidersHorizontal,
    Users,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button, buttonVariants } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { mentorApi, getMentorHeadline, formatMentorHourlyRate } from '../lib/mentorApi';
import type { MentorLevel, MentorListParams, MentorListSortBy, MentorSortOrder } from '../lib/mentorApi';
import { mentorQueryKeys } from '../lib/mentorQueryKeys';
import { getErrorMessage } from '../lib/appError';
import { cn } from '../lib/utils';

const LEVEL_OPTIONS: Array<{ value: MentorLevel; label: string }> = [
    { value: 'STUDENT', label: 'Student' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'MIDDLE', label: 'Middle' },
    { value: 'SENIOR', label: 'Senior' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'ARCHITECT', label: 'Architect' },
    { value: 'MANAGER', label: 'Manager' },
];

const SORT_OPTIONS: Array<{ value: MentorListSortBy; label: string }> = [
    { value: 'reviewCount', label: 'Nổi bật nhất' },
    { value: 'yearsOfExperience', label: 'Kinh nghiệm nhiều nhất' },
    { value: 'hourlyRate', label: 'Chi phí thấp hơn' },
    { value: 'updatedAt', label: 'Cập nhật gần đây' },
    { value: 'name', label: 'Tên A-Z' },
];

function MentorCard({ mentor }: { mentor: Awaited<ReturnType<typeof mentorApi.list>>['mentors'][number] }) {
    return (
        <Link
            to={`/mentors/${mentor.slug}`}
            className="group block h-full overflow-hidden rounded-[28px] border border-border/60 bg-background p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                    <Avatar src={mentor.avatarUrl} alt={mentor.name} size="lg" className="ring-4 ring-primary/8" />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="truncate text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                                {mentor.name}
                            </h2>
                            {mentor.isVerified && <BadgeCheck size={18} className="shrink-0 text-primary" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {getMentorHeadline(mentor)}
                        </p>
                    </div>
                </div>
                {mentor.level && (
                    <Badge variant="secondary" className="shrink-0 border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                        {mentor.level}
                    </Badge>
                )}
            </div>

            {mentor.bio && (
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-foreground/85">
                    {mentor.bio}
                </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
                {mentor.expertise.slice(0, 3).map((item) => (
                    <Badge key={item} variant="outline" className="border-border/70 bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
                        {item}
                    </Badge>
                ))}
                {mentor.expertise.length === 0 && mentor.expertiseArea && (
                    <Badge variant="outline" className="border-border/70 bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
                        {mentor.expertiseArea}
                    </Badge>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-[22px] border border-border/60 bg-surface/45 p-4 text-sm">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Kinh nghiệm</p>
                    <p className="mt-1 font-medium text-foreground">
                        {mentor.yearsOfExperience != null ? `${mentor.yearsOfExperience} năm` : 'Đang cập nhật'}
                    </p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Chi phí</p>
                    <p className="mt-1 font-medium text-foreground">{formatMentorHourlyRate(mentor.hourlyRate)}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ngôn ngữ</p>
                    <p className="mt-1 font-medium text-foreground">{mentor.consultationLang || 'Việt / English'}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Độ tin cậy</p>
                    <p className="mt-1 font-medium text-foreground">{mentor.reviewCount.toLocaleString('vi-VN')} đánh giá</p>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-sm">
                <div className="min-w-0 text-muted-foreground">
                    <p className="truncate">{mentor.currentCompany || mentor.currentSchool || 'IT Compass Network'}</p>
                    {mentor.currentJobTitle && <p className="truncate text-xs">{mentor.currentJobTitle}</p>}
                </div>
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                    Xem chi tiết <ArrowRight size={15} />
                </span>
            </div>
        </Link>
    );
}

function MentorCardSkeleton() {
    return (
        <div className="rounded-[28px] border border-border/60 bg-background p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-5 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="mt-5 flex gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

export default function MentorPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [expertiseArea, setExpertiseArea] = useState('');
    const [level, setLevel] = useState<string>('');
    const [sortBy, setSortBy] = useState<MentorListSortBy>('reviewCount');
    const [verifiedOnly, setVerifiedOnly] = useState(true);

    useEffect(() => {
        setPage(1);
    }, [search, expertiseArea, level, sortBy, verifiedOnly]);

    const params = useMemo<MentorListParams>(() => {
        const sortOrder: MentorSortOrder = sortBy === 'name' || sortBy === 'hourlyRate' ? 'asc' : 'desc';

        return {
            page,
            limit: 9,
            search: search.trim() || undefined,
            expertiseArea: expertiseArea.trim() || undefined,
            level: (level || undefined) as MentorLevel | undefined,
            isVerified: verifiedOnly ? true : undefined,
            sortBy,
            sortOrder,
        };
    }, [expertiseArea, level, page, search, sortBy, verifiedOnly]);

    const paramsKey = JSON.stringify(params);

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.list(paramsKey),
        queryFn: () => mentorApi.list(params),
    });

    const mentors = data?.mentors ?? [];
    const pagination = data?.pagination;

    return (
        <>
            <Helmet>
                <title>Tìm Mentor IT — IT Compass</title>
                <meta
                    name="description"
                    content="Khám phá mentor thực chiến trong ngành CNTT, lọc theo chuyên môn, kinh nghiệm và mức độ phù hợp với hành trình của bạn."
                />
            </Helmet>

            <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
                <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_22%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.96))] px-6 py-10 sm:px-10 sm:py-14">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />
                    <div className="relative grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                        >
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary backdrop-blur">
                                <Users size={14} /> Mentor network
                            </div>
                            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl sm:leading-[1.05]">
                                Tìm người đi trước phù hợp với hành trình IT của bạn.
                            </h1>
                            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                Từ sinh viên, fresher tới senior và lead — chọn mentor theo chuyên môn, kinh nghiệm và cách họ đang làm việc ngoài thị trường thật.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 backdrop-blur">
                                    <BadgeCheck size={15} className="text-primary" /> Ưu tiên mentor đã xác minh
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 backdrop-blur">
                                    <Clock3 size={15} className="text-primary" /> Kinh nghiệm và chi phí minh bạch
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 backdrop-blur">
                                    <Briefcase size={15} className="text-primary" /> Góc nhìn thực chiến từ người đang làm nghề
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.08 }}
                            className="rounded-[28px] border border-border/70 bg-background/85 p-5 shadow-xl shadow-primary/5 backdrop-blur"
                        >
                            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Filter size={16} className="text-primary" /> Bộ lọc nhanh
                            </div>
                            <div className="space-y-4">
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Tên mentor, công ty hoặc từ khóa"
                                    icon={<Search size={16} />}
                                    className="h-11 rounded-xl"
                                />
                                <Input
                                    value={expertiseArea}
                                    onChange={(event) => setExpertiseArea(event.target.value)}
                                    placeholder="Ví dụ: frontend, backend, data..."
                                    icon={<SlidersHorizontal size={16} />}
                                    className="h-11 rounded-xl"
                                />
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <label className="space-y-1.5">
                                        <span className="text-sm font-medium text-foreground">Level</span>
                                        <select
                                            value={level}
                                            onChange={(event) => setLevel(event.target.value)}
                                            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                        >
                                            <option value="">Tất cả level</option>
                                            {LEVEL_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="space-y-1.5">
                                        <span className="text-sm font-medium text-foreground">Sắp xếp</span>
                                        <select
                                            value={sortBy}
                                            onChange={(event) => setSortBy(event.target.value as MentorListSortBy)}
                                            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                                        >
                                            {SORT_OPTIONS.map((item) => (
                                                <option key={item.value} value={item.value}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVerifiedOnly((value) => !value)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors',
                                        verifiedOnly
                                            ? 'border-primary/20 bg-primary/10 text-primary'
                                            : 'border-border/70 bg-surface/50 text-muted-foreground',
                                    )}
                                >
                                    <span className="font-medium">Chỉ hiển thị mentor đã xác minh</span>
                                    <span className="text-xs uppercase tracking-[0.18em]">{verifiedOnly ? 'ON' : 'OFF'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {pagination
                                    ? `${pagination.total.toLocaleString('vi-VN')} mentor phù hợp`
                                    : isLoading
                                      ? 'Đang tải mentor...'
                                      : `${mentors.length.toLocaleString('vi-VN')} mentor`}
                            </p>
                            <h2 className="mt-1 text-2xl font-bold text-foreground">Danh sách mentor</h2>
                        </div>
                        <Link to="/test" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2 self-start sm:self-auto')}>
                            Làm trắc nghiệm để được gợi ý <ArrowRight size={15} />
                        </Link>
                    </div>
                </section>

                <section className="mt-8">
                    {isLoading ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <MentorCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 px-6 py-12">
                            <EmptyState
                                icon={<Users size={28} />}
                                title="Không thể tải danh sách mentor"
                                description={getErrorMessage(error, 'Đã có lỗi khi tải dữ liệu mentor.')}
                            />
                        </div>
                    ) : mentors.length === 0 ? (
                        <div className="rounded-[28px] border border-border/60 bg-surface/40 px-6 py-12">
                            <EmptyState
                                icon={<Search size={28} />}
                                title="Không có mentor phù hợp"
                                description="Hãy thử đổi từ khóa, level hoặc tắt bộ lọc đã xác minh để xem thêm kết quả."
                                action={
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setExpertiseArea('');
                                            setLevel('');
                                            setSortBy('reviewCount');
                                            setVerifiedOnly(true);
                                        }}
                                    >
                                        Đặt lại bộ lọc
                                    </Button>
                                }
                            />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {mentors.map((mentor, index) => (
                                    <motion.article
                                        key={mentor.id}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.24) }}
                                    >
                                        <MentorCard mentor={mentor} />
                                    </motion.article>
                                ))}
                            </div>

                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <Button variant="outline" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>
                                        Trang trước
                                    </Button>
                                    <div className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm text-muted-foreground">
                                        Trang <span className="font-semibold text-foreground">{pagination.page}</span> / {pagination.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage((current) => Math.min(current + 1, pagination.totalPages))}
                                        disabled={page >= pagination.totalPages}
                                    >
                                        Trang sau
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
