import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Brain,
    CircleAlert,
    Compass,
    Sparkles,
    Target,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonVariants } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Loader } from '../../components/ui/Loader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../lib/appError';
import type { AssessmentTemplate } from '../../lib/assessmentApi';
import { assessmentApi } from '../../lib/assessmentApi';
import { createQuizAuthState } from '../../lib/authNavigation';
import { assessmentQueryKeys } from '../../lib/assessmentQueryKeys';
import {
    clearPendingQuizResult,
    clearQuizDraft,
    getPendingQuizResult,
    getStoredQuizDraft,
    isPendingQuizResultComplete,
    savePendingQuizResult,
    saveQuizDraft,
    type PendingQuizResult,
    type QuizDraft,
} from '../../lib/quizDraft';
import { cn } from '../../lib/utils';
import { HOLLAND_TRAIT_MAP } from '../../lib/constants/holland';

const HOLLAND_SCALE = [
    { value: 1, label: 'Rất không đúng', helper: 'Gần như không muốn làm' },
    { value: 2, label: 'Không đúng lắm', helper: 'Ít hứng thú' },
    { value: 3, label: 'Trung lập', helper: 'Có thể cân nhắc' },
    { value: 4, label: 'Khá đúng', helper: 'Muốn thử nghiêm túc' },
    { value: 5, label: 'Rất đúng', helper: 'Rất phù hợp với tôi' },
] as const;

const HOLLAND_META: Record<string, { label: string; accent: string }> = {
    R: { label: HOLLAND_TRAIT_MAP['R'], accent: 'from-sky-500/20 to-cyan-500/15 text-sky-700' },
    I: { label: HOLLAND_TRAIT_MAP['I'], accent: 'from-indigo-500/20 to-primary/15 text-indigo-700' },
    A: { label: HOLLAND_TRAIT_MAP['A'], accent: 'from-pink-500/20 to-fuchsia-500/15 text-pink-700' },
    S: { label: HOLLAND_TRAIT_MAP['S'], accent: 'from-emerald-500/20 to-green-500/15 text-emerald-700' },
    E: { label: HOLLAND_TRAIT_MAP['E'], accent: 'from-amber-500/20 to-orange-500/15 text-amber-700' },
    C: { label: HOLLAND_TRAIT_MAP['C'], accent: 'from-slate-500/20 to-zinc-500/15 text-slate-700' },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const filterDraftAnswers = (template: AssessmentTemplate, draft: QuizDraft | null) => {
    const hollandQuestionIds = new Set(template.hollandQuestions.map((question) => question.id));
    const situationalQuestionMap = new Map(
        template.situationalQuestions.map((question) => [question.id, new Set(question.options.map((option) => option.id))]),
    );

    const hollandAnswers = Object.fromEntries(
        Object.entries(draft?.hollandAnswers ?? {}).filter(
            ([questionId, value]) => hollandQuestionIds.has(questionId) && Number.isInteger(value) && value >= 1 && value <= 5,
        ),
    ) as Record<string, number>;

    const situationalAnswers = Object.fromEntries(
        Object.entries(draft?.situationalAnswers ?? {}).filter(([questionId, optionId]) =>
            situationalQuestionMap.get(questionId)?.has(optionId),
        ),
    ) as Record<string, string>;

    return { hollandAnswers, situationalAnswers };
};

function QuizSkeleton() {
    return (
        <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-[520px] rounded-[36px]" />
            </div>
        </main>
    );
}

export default function QuizPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAuthenticated, isInitialized } = useAuth();

    const [hollandAnswers, setHollandAnswers] = useState<Record<string, number>>({});
    const [situationalAnswers, setSituationalAnswers] = useState<Record<string, string>>({});
    const [hollandIndex, setHollandIndex] = useState(0);
    const [situationalIndex, setSituationalIndex] = useState(0);
    const [quizStartedAt, setQuizStartedAt] = useState(() => new Date().toISOString());
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [pendingResult, setPendingResult] = useState<PendingQuizResult | null>(null);

    const templateQuery = useQuery({
        queryKey: assessmentQueryKeys.currentTemplate,
        queryFn: () => assessmentApi.getCurrentTemplate(),
    });

    const template = templateQuery.data?.template ?? null;
    const hollandCount = template?.hollandQuestions.length ?? 0;
    const situationalCount = template?.situationalQuestions.length ?? 0;
    const isSituationalPhase = Boolean(template) && hollandIndex >= hollandCount;
    const currentHollandQuestion = template && !isSituationalPhase ? template.hollandQuestions[hollandIndex] : null;
    const currentSituationalQuestion = template && isSituationalPhase ? template.situationalQuestions[situationalIndex] : null;
    const currentQuestionNumber = template
        ? isSituationalPhase
            ? hollandCount + situationalIndex + 1
            : hollandIndex + 1
        : 0;
    const totalQuestions = template?.questionCount ?? 0;
    const progressPercent = totalQuestions > 0 ? Math.round((currentQuestionNumber / totalQuestions) * 100) : 0;
    const hasAnsweredCurrentQuestion = currentHollandQuestion
        ? hollandAnswers[currentHollandQuestion.id] != null
        : currentSituationalQuestion
            ? Boolean(situationalAnswers[currentSituationalQuestion.id])
            : false;

    const pendingResultComplete = useMemo(
        () => (template ? isPendingQuizResultComplete(pendingResult, template) : false),
        [pendingResult, template],
    );

    useEffect(() => {
        if (!template || hasRestoredDraft) return;

        const draft = getStoredQuizDraft();
        const filtered = filterDraftAnswers(template, draft);
        const restoredHollandIndex = clamp(draft?.hollandIndex ?? 0, 0, template.hollandQuestions.length);
        const restoredSituationalIndex = clamp(
            draft?.situationalIndex ?? 0,
            0,
            Math.max(template.situationalQuestions.length - 1, 0),
        );

        setHollandAnswers(filtered.hollandAnswers);
        setSituationalAnswers(filtered.situationalAnswers);
        setHollandIndex(restoredHollandIndex);
        setSituationalIndex(restoredSituationalIndex);
        setQuizStartedAt(draft?.quizStartedAt ?? new Date().toISOString());

        const pending = getPendingQuizResult();
        if (pending) {
            if (isPendingQuizResultComplete(pending, template)) {
                setPendingResult(pending);
            } else {
                clearPendingQuizResult();
            }
        }

        setHasRestoredDraft(true);
    }, [hasRestoredDraft, template]);

    useEffect(() => {
        if (!template || !hasRestoredDraft) return;

        saveQuizDraft({
            hollandAnswers,
            situationalAnswers,
            hollandIndex,
            situationalIndex,
            quizStartedAt,
        });
    }, [hasRestoredDraft, hollandAnswers, hollandIndex, quizStartedAt, situationalAnswers, situationalIndex, template]);

    const submitMutation = useMutation({
        mutationFn: (input: PendingQuizResult) =>
            assessmentApi.submitAttempt({
                startedAt: input.startedAt ?? quizStartedAt,
                hollandAnswers: input.hollandAnswers,
                situationalAnswers: input.situationalAnswers,
            }),
        onSuccess: async ({ attempt }) => {
            clearQuizDraft();
            clearPendingQuizResult();
            setPendingResult(null);
            queryClient.setQueryData(assessmentQueryKeys.latestAttempt, { attempt });
            await queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.latestAttempt });
            navigate('/test/result', { replace: true, state: { attempt } });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể nộp bài trắc nghiệm lúc này.'));
        },
    });

    const persistAndRedirectToLogin = () => {
        const payload: PendingQuizResult = {
            hollandAnswers,
            situationalAnswers,
            startedAt: quizStartedAt,
        };

        savePendingQuizResult(payload);
        setPendingResult(payload);
        toast.info('Chúng tôi đã giữ câu trả lời hiện tại. Đăng nhập để nộp và lưu kết quả chính thức.');
        navigate('/auth/login?redirect=/test/quiz', {
            state: createQuizAuthState('login'),
            replace: false,
        });
    };

    const handleSubmit = () => {
        if (!template) return;

        const payload: PendingQuizResult = {
            hollandAnswers,
            situationalAnswers,
            startedAt: quizStartedAt,
        };

        if (!isAuthenticated) {
            persistAndRedirectToLogin();
            return;
        }

        submitMutation.mutate(payload);
    };

    const handleNext = () => {
        if (!template || !hasAnsweredCurrentQuestion) return;

        if (!isSituationalPhase) {
            if (hollandIndex < hollandCount - 1) {
                setHollandIndex((current) => current + 1);
                return;
            }

            setHollandIndex(hollandCount);
            setSituationalIndex(0);
            return;
        }

        if (situationalIndex < situationalCount - 1) {
            setSituationalIndex((current) => current + 1);
            return;
        }

        handleSubmit();
    };

    const handleBack = () => {
        if (!template || currentQuestionNumber <= 1) return;

        if (!isSituationalPhase) {
            setHollandIndex((current) => Math.max(current - 1, 0));
            return;
        }

        if (situationalIndex > 0) {
            setSituationalIndex((current) => current - 1);
            return;
        }

        setHollandIndex(Math.max(hollandCount - 1, 0));
    };

    const restorePendingIntoForm = () => {
        if (!pendingResult || !template || !pendingResultComplete) return;

        setHollandAnswers(pendingResult.hollandAnswers);
        setSituationalAnswers(pendingResult.situationalAnswers);
        setQuizStartedAt(pendingResult.startedAt ?? new Date().toISOString());
        setHollandIndex(hollandCount);
        setSituationalIndex(Math.max(situationalCount - 1, 0));
        toast.success('Đã nạp lại bộ câu trả lời chờ nộp vào form hiện tại.');
    };

    if (templateQuery.isLoading || !hasRestoredDraft) {
        return <QuizSkeleton />;
    }

    if (templateQuery.error || !template || (!currentHollandQuestion && !currentSituationalQuestion)) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
                <div className="w-full max-w-2xl rounded-[32px] border border-destructive/20 bg-destructive/5 px-6 py-14">
                    <EmptyState
                        icon={<Brain size={28} />}
                        title="Không thể tải bài trắc nghiệm"
                        description={getErrorMessage(templateQuery.error, 'Bộ câu hỏi hiện không khả dụng. Vui lòng thử lại sau.')}
                        action={
                            <Link to="/test" className={buttonVariants({ variant: 'outline' })}>
                                Quay lại trang giới thiệu
                            </Link>
                        }
                    />
                </div>
            </main>
        );
    }

    const currentMeta = currentHollandQuestion ? HOLLAND_META[currentHollandQuestion.group] : null;
    const currentAnswerValue = currentHollandQuestion ? hollandAnswers[currentHollandQuestion.id] : null;
    const currentSituationalValue = currentSituationalQuestion ? situationalAnswers[currentSituationalQuestion.id] : null;
    const isLastQuestion = isSituationalPhase && situationalIndex === situationalCount - 1;

    return (
        <>
            <Helmet>
                <title>Làm bài trắc nghiệm IT — IT Compass</title>
                <meta
                    name="description"
                    content="Hoàn thành bài trắc nghiệm định hướng CNTT từng bước, tự động lưu tiến độ trong phiên và nhận kết quả chính thức sau khi đăng nhập nộp bài."
                />
            </Helmet>

            <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_25%),linear-gradient(180deg,#f8fafc,#ffffff)] px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="flex flex-col gap-4 rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-lg shadow-primary/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                                <Sparkles size={14} /> Phiên quiz tập trung
                            </div>
                            <h1 className="text-lg font-bold text-foreground sm:text-xl">{isSituationalPhase ? 'Phần tình huống' : 'Phần Holland'}</h1>
                            <p className="text-sm text-muted-foreground">
                                Câu {currentQuestionNumber}/{totalQuestions} · Tự động lưu trong phiên hiện tại
                            </p>
                        </div>
                        <div className="w-full max-w-xs sm:w-72">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                <span>Tiến độ</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-secondary/70">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500"
                                    initial={false}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>
                    </div>

                    {pendingResultComplete && isAuthenticated && (
                        <motion.section
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="rounded-[28px] border border-primary/20 bg-primary/10 p-5"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Bản chờ nộp</p>
                                    <h2 className="mt-2 text-xl font-bold text-foreground">Có một lượt làm hoàn chỉnh đang chờ lưu kết quả.</h2>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Nếu bạn vừa đăng nhập sau khi hoàn tất câu trả lời, có thể nộp ngay mà không cần làm lại từ đầu.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button
                                        onClick={() => {
                                            if (!pendingResult) return;
                                            submitMutation.mutate(pendingResult);
                                        }}
                                        isLoading={submitMutation.isPending}
                                        className="min-w-[180px]"
                                    >
                                        Nộp kết quả ngay
                                    </Button>
                                    <Button variant="outline" onClick={restorePendingIntoForm}>
                                        Xem lại câu trả lời
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            clearPendingQuizResult();
                                            setPendingResult(null);
                                            toast.success('Đã xóa lượt làm chờ nộp.');
                                        }}
                                    >
                                        Bỏ bản chờ
                                    </Button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {!isAuthenticated && isInitialized && (
                        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Bạn có thể làm quiz ngay lúc này. Khi tới bước nộp bài, hệ thống sẽ yêu cầu đăng nhập để lưu kết quả chính thức.
                        </div>
                    )}

                    <motion.section
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden rounded-[36px] border border-border/60 bg-background shadow-2xl shadow-primary/5"
                    >
                        <div className="border-b border-border/60 px-6 py-5 sm:px-8">
                            <div className="flex flex-wrap items-center gap-3">
                                {currentMeta ? (
                                    <Badge className={cn('border-transparent bg-gradient-to-r px-3 py-1 text-[11px] uppercase tracking-[0.18em]', currentMeta.accent)}>
                                        {currentHollandQuestion?.group} · {currentMeta.label}
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                                        Tình huống mô phỏng
                                    </Badge>
                                )}
                                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/50 px-3 py-1 text-xs text-muted-foreground">
                                    {currentMeta ? <Target size={14} /> : <Compass size={14} />}
                                    {currentMeta ? 'Tự lượng giá mức độ phù hợp' : 'Chọn cách bạn sẽ hành động'}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-8 sm:px-8 lg:py-10">
                            <div className="mx-auto max-w-4xl">
                                {currentHollandQuestion ? (
                                    <>
                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Câu hỏi thiên hướng</p>
                                        <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl sm:leading-[1.1]">
                                            {currentHollandQuestion.text}
                                        </h2>
                                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                            Chọn mức độ phản ánh đúng sở thích hoặc thiên hướng thật của bạn. Đừng nghĩ theo “nên làm”, hãy chọn theo “thực sự muốn làm”.
                                        </p>

                                        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
                                            {HOLLAND_SCALE.map((option) => {
                                                const selected = currentAnswerValue === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setHollandAnswers((current) => ({ ...current, [currentHollandQuestion.id]: option.value }))}
                                                        className={cn(
                                                            'flex flex-col items-center justify-center gap-3 rounded-[24px] border p-4 text-center transition-all',
                                                            selected
                                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                                                : 'border-border/60 bg-surface/35 hover:border-primary/25 hover:bg-background',
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black',
                                                                selected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-foreground',
                                                            )}
                                                        >
                                                            {option.value}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{option.label}</p>
                                                            <p className="mt-1.5 text-xs text-muted-foreground tracking-tight">{option.helper}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : currentSituationalQuestion ? (
                                    <>
                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tình huống mô phỏng</p>
                                        <p className="mt-4 rounded-[24px] border border-primary/15 bg-primary/10 px-5 py-4 text-sm leading-7 text-foreground/90">
                                            {currentSituationalQuestion.context}
                                        </p>
                                        <h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl sm:leading-[1.1]">
                                            {currentSituationalQuestion.text}
                                        </h2>
                                        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                                            Chọn phương án phản ánh cách bạn sẽ thực sự ưu tiên hành động. Không có đáp án “đẹp” cho tất cả mọi người.
                                        </p>

                                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                            {currentSituationalQuestion.options.map((option, index) => {
                                                const selected = currentSituationalValue === option.id;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setSituationalAnswers((current) => ({
                                                                ...current,
                                                                [currentSituationalQuestion.id]: option.id,
                                                            }))
                                                        }
                                                        className={cn(
                                                            'rounded-[24px] border p-4 text-left transition-all sm:p-5',
                                                            selected
                                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                                                : 'border-border/60 bg-surface/35 hover:border-primary/25 hover:bg-background',
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div
                                                                className={cn(
                                                                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black',
                                                                    selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
                                                                )}
                                                            >
                                                                {String.fromCharCode(65 + index)}
                                                            </div>
                                                            <p className="text-sm leading-7 text-foreground/90 sm:text-base">{option.text}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" onClick={handleBack} disabled={currentQuestionNumber <= 1 || submitMutation.isPending}>
                                    <ArrowLeft size={16} /> Câu trước
                                </Button>
                                <Link to="/test" className={cn(buttonVariants({ variant: 'ghost' }), 'justify-center')}>
                                    Thoát quiz
                                </Link>
                            </div>
                            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                {!hasAnsweredCurrentQuestion && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                                        <CircleAlert size={15} /> Chọn một đáp án để tiếp tục
                                    </div>
                                )}
                                <Button onClick={handleNext} disabled={!hasAnsweredCurrentQuestion} isLoading={submitMutation.isPending} size="lg">
                                    {isLastQuestion ? 'Nộp bài và xem kết quả' : 'Tiếp tục'}
                                    {!isLastQuestion && <ArrowRight size={16} />}
                                </Button>
                            </div>
                        </div>
                    </motion.section>

                    {submitMutation.isPending && (
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                            <Loader size="sm" /> Hệ thống đang chấm điểm và lưu kết quả của bạn...
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
