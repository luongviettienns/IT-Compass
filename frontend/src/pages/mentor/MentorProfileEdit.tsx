/**
 * @file MentorProfileEdit.tsx - Trang chỉnh sửa hồ sơ mentor.
 *
 * Form chia 3 sections: Cơ bản, Chuyên môn, Công khai.
 * Floating save bar (sticky bottom) hiện khi form dirty.
 */

import { useEffect, useState, useMemo, type ChangeEvent, type ComponentType, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
    Briefcase,
    Globe2,
    Save,
    User,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { mentorApi } from '../../lib/mentorApi';
import { mentorQueryKeys } from '../../lib/mentorQueryKeys';
import { getErrorMessage } from '../../lib/appError';

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

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const NAME_MIN = 2;
const NAME_MAX = 150;
const SLUG_MAX = 180;
const TITLE_MAX = 191;
const BIO_MAX = 5000;
const EXPERTISE_AREA_MAX = 100;
const YEARS_OF_EXPERIENCE_MAX = 80;
const HOURLY_RATE_MAX = 100_000_000;
const CURRENT_INFO_MAX = 191;
const CONSULTATION_LANG_MAX = 100;

type FormState = {
    name: string;
    slug: string;
    title: string;
    bio: string;
    level: string;
    expertiseArea: string;
    yearsOfExperience: string;
    hourlyRate: string;
    currentSchool: string;
    currentCompany: string;
    currentJobTitle: string;
    consultationLang: string;
    avatarUrl: string;
};

const emptyForm: FormState = {
    name: '', slug: '', title: '', bio: '', level: '',
    expertiseArea: '', yearsOfExperience: '', hourlyRate: '',
    currentSchool: '', currentCompany: '', currentJobTitle: '',
    consultationLang: '', avatarUrl: '',
};

function formFromMentor(m: Record<string, unknown>): FormState {
    return {
        name: (m.name as string) || '',
        slug: (m.slug as string) || '',
        title: (m.title as string) || '',
        bio: (m.bio as string) || '',
        level: (m.level as string) || '',
        expertiseArea: (m.expertiseArea as string) || '',
        yearsOfExperience: m.yearsOfExperience != null ? String(m.yearsOfExperience) : '',
        hourlyRate: m.hourlyRate != null ? String(m.hourlyRate) : '',
        currentSchool: (m.currentSchool as string) || '',
        currentCompany: (m.currentCompany as string) || '',
        currentJobTitle: (m.currentJobTitle as string) || '',
        consultationLang: (m.consultationLang as string) || '',
        avatarUrl: (m.avatarUrl as string) || '',
    };
}

function SectionCard({
    title,
    icon: Icon,
    color,
    children,
    delay = 0,
}: {
    title: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    color: string;
    children: ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: EASE }}
            className={`rounded-[28px] border border-border/60 bg-background overflow-hidden`}
        >
            <div className={`border-t-2 ${color}`} />
            <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Icon size={18} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{title}</h2>
                </div>
                {children}
            </div>
        </motion.div>
    );
}

export default function MentorProfileEdit() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>(emptyForm);
    const [initialForm, setInitialForm] = useState<FormState>(emptyForm);

    const { data, isLoading, error } = useQuery({
        queryKey: mentorQueryKeys.dashboard,
        queryFn: mentorApi.getDashboard,
    });

    const mentor = data?.mentor;

    useEffect(() => {
        if (!mentor) return;
        const parsed = formFromMentor(mentor as unknown as Record<string, unknown>);
        setForm(parsed);
        setInitialForm(parsed);
    }, [mentor]);

    const isDirty = useMemo(
        () => JSON.stringify(form) !== JSON.stringify(initialForm),
        [form, initialForm],
    );

    const set = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value }));

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
            setInitialForm(form);
            toast.success('Đã cập nhật hồ sơ mentor.');
        },
        onError: (mutationError) => {
            toast.error(getErrorMessage(mutationError, 'Không thể cập nhật hồ sơ.'));
        },
    });

    const validateForm = () => {
        const name = form.name.trim();
        if (!name) {
            toast.error('Vui lòng nhập tên hiển thị.');
            return false;
        }
        if (name.length < NAME_MIN || name.length > NAME_MAX) {
            toast.error(`Tên hiển thị phải từ ${NAME_MIN} đến ${NAME_MAX} ký tự.`);
            return false;
        }

        const slug = form.slug.trim();
        if (!slug) {
            toast.error('Vui lòng nhập slug URL.');
            return false;
        }
        if (slug.length > SLUG_MAX) {
            toast.error(`Slug URL không được vượt quá ${SLUG_MAX} ký tự.`);
            return false;
        }

        const title = form.title.trim();
        if (title.length > TITLE_MAX) {
            toast.error(`Headline / Title không được vượt quá ${TITLE_MAX} ký tự.`);
            return false;
        }

        const bio = form.bio.trim();
        if (bio.length > BIO_MAX) {
            toast.error(`Bio giới thiệu không được vượt quá ${BIO_MAX} ký tự.`);
            return false;
        }

        const expertiseArea = form.expertiseArea.trim();
        if (expertiseArea.length > EXPERTISE_AREA_MAX) {
            toast.error(`Chuyên môn chính không được vượt quá ${EXPERTISE_AREA_MAX} ký tự.`);
            return false;
        }

        const consultationLang = form.consultationLang.trim();
        if (consultationLang.length > CONSULTATION_LANG_MAX) {
            toast.error(`Ngôn ngữ tư vấn không được vượt quá ${CONSULTATION_LANG_MAX} ký tự.`);
            return false;
        }

        const currentSchool = form.currentSchool.trim();
        if (currentSchool.length > CURRENT_INFO_MAX) {
            toast.error(`Trường học không được vượt quá ${CURRENT_INFO_MAX} ký tự.`);
            return false;
        }

        const currentCompany = form.currentCompany.trim();
        if (currentCompany.length > CURRENT_INFO_MAX) {
            toast.error(`Công ty hiện tại không được vượt quá ${CURRENT_INFO_MAX} ký tự.`);
            return false;
        }

        const currentJobTitle = form.currentJobTitle.trim();
        if (currentJobTitle.length > CURRENT_INFO_MAX) {
            toast.error(`Job title hiện tại không được vượt quá ${CURRENT_INFO_MAX} ký tự.`);
            return false;
        }

        if (form.yearsOfExperience) {
            const years = Number(form.yearsOfExperience);
            if (!Number.isInteger(years) || years < 0 || years > YEARS_OF_EXPERIENCE_MAX) {
                toast.error(`Số năm kinh nghiệm phải từ 0 đến ${YEARS_OF_EXPERIENCE_MAX}.`);
                return false;
            }
        }

        if (form.hourlyRate) {
            const hourlyRate = Number(form.hourlyRate);
            if (!Number.isInteger(hourlyRate) || hourlyRate < 0 || hourlyRate > HOURLY_RATE_MAX) {
                toast.error(`Chi phí / giờ phải từ 0 đến ${HOURLY_RATE_MAX}.`);
                return false;
            }
        }

        return true;
    };

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
                    icon={<User size={28} />}
                    title="Không thể tải hồ sơ"
                    description={getErrorMessage(error, 'Phiên mentor chưa sẵn sàng.')}
                />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Chỉnh sửa hồ sơ — Mentor Portal — IT Compass</title>
            </Helmet>

            <div className="p-6 sm:p-8 lg:p-10 space-y-6 pb-28">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mentor Portal</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Chỉnh sửa hồ sơ</h1>
                    <p className="mt-1 text-muted-foreground">
                        Cập nhật thông tin để hiển thị tốt nhất cho học viên.
                    </p>
                </motion.div>

                {/* Section 1: Cơ bản */}
                <SectionCard title="Thông tin cơ bản" icon={User} color="border-blue-500" delay={0.05}>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        {/* Avatar Preview */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                            <Avatar
                                src={form.avatarUrl || mentor.avatarUrl}
                                alt={form.name || mentor.name}
                                size="xl"
                                className="ring-4 ring-primary/10"
                            />
                            <span className="text-[11px] text-muted-foreground">Xem trước avatar</span>
                        </div>

                        <div className="flex-1 grid gap-4 sm:grid-cols-2">
                            <Input label="Tên hiển thị" value={form.name} onChange={set('name')} />
                            <Input label="Slug (URL)" value={form.slug} onChange={set('slug')} />
                            <Input label="Headline / Title" value={form.title} onChange={set('title')} />
                            <Input label="Avatar URL" value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://..." />
                        </div>
                    </div>
                </SectionCard>

                {/* Section 2: Chuyên môn */}
                <SectionCard title="Chuyên môn & Kinh nghiệm" icon={Briefcase} color="border-cyan-500" delay={0.1}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Chuyên môn chính" value={form.expertiseArea} onChange={set('expertiseArea')} />
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-foreground">Level</span>
                            <select
                                value={form.level}
                                onChange={set('level')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                            >
                                {LEVEL_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </select>
                        </label>
                        <Input type="number" label="Số năm kinh nghiệm" value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
                        <Input type="number" label="Chi phí / giờ (VNĐ)" value={form.hourlyRate} onChange={set('hourlyRate')} />
                    </div>
                </SectionCard>

                {/* Section 3: Công khai */}
                <SectionCard title="Hiển thị công khai" icon={Globe2} color="border-emerald-500" delay={0.15}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Công ty hiện tại" value={form.currentCompany} onChange={set('currentCompany')} />
                        <Input label="Job title hiện tại" value={form.currentJobTitle} onChange={set('currentJobTitle')} />
                        <Input label="Trường học" value={form.currentSchool} onChange={set('currentSchool')} />
                        <Input label="Ngôn ngữ tư vấn" value={form.consultationLang} onChange={set('consultationLang')} placeholder="Ví dụ: Tiếng Việt, English" />
                    </div>

                    <div className="mt-4">
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-foreground">Bio giới thiệu</span>
                            <textarea
                                value={form.bio}
                                onChange={(e) => {
                                    if (e.target.value.length <= BIO_MAX) {
                                        setForm((prev) => ({ ...prev, bio: e.target.value }));
                                    }
                                }}
                                rows={5}
                                className="flex w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
                                placeholder="Giới thiệu ngắn về kinh nghiệm, thế mạnh và kiểu vấn đề bạn có thể hỗ trợ mentee."
                            />
                            <div className="flex justify-end">
                                <span className="text-[11px] text-muted-foreground">
                                    {form.bio.length}/{BIO_MAX}
                                </span>
                            </div>
                        </label>
                    </div>
                </SectionCard>
            </div>

            {/* ── Floating Save Bar ─────────────────────────────── */}
            <AnimatePresence>
                {isDirty && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-xl px-6 py-4 shadow-2xl"
                    >
                        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">
                                Bạn có thay đổi chưa lưu.
                            </p>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setForm(initialForm);
                                        toast('Đã hoàn tác thay đổi.');
                                    }}
                                >
                                    Hoàn tác
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!validateForm()) return;
                                        updateMutation.mutate();
                                    }}
                                    isLoading={updateMutation.isPending}
                                    className="gap-2"
                                >
                                    <Save size={16} /> Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
