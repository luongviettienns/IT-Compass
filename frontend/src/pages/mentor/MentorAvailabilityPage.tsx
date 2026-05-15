import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { CalendarClock, Clock3, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { bookingApi, type MentorAvailabilityBlock } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { getErrorMessage } from '../../lib/appError';

const WEEKDAYS = [
    { value: 1, label: 'Thứ hai' },
    { value: 2, label: 'Thứ ba' },
    { value: 3, label: 'Thứ tư' },
    { value: 4, label: 'Thứ năm' },
    { value: 5, label: 'Thứ sáu' },
    { value: 6, label: 'Thứ bảy' },
    { value: 0, label: 'Chủ nhật' },
] as const;

type AvailabilityDraftBlock = {
    localId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
};

type SettingsForm = {
    minDurationMinute: string;
    maxDurationMinute: string;
    defaultDurationMinute: string;
    bookingNoticeHour: string;
    maxAdvanceDay: string;
    bufferBeforeMinute: string;
    bufferAfterMinute: string;
};

const defaultSettingsForm: SettingsForm = {
    minDurationMinute: '30',
    maxDurationMinute: '120',
    defaultDurationMinute: '60',
    bookingNoticeHour: '2',
    maxAdvanceDay: '30',
    bufferBeforeMinute: '0',
    bufferAfterMinute: '0',
};

const settingsToForm = (settings: {
    minDurationMinute: number;
    maxDurationMinute: number;
    defaultDurationMinute: number;
    bookingNoticeHour: number;
    maxAdvanceDay: number;
    bufferBeforeMinute: number;
    bufferAfterMinute: number;
}): SettingsForm => ({
    minDurationMinute: String(settings.minDurationMinute),
    maxDurationMinute: String(settings.maxDurationMinute),
    defaultDurationMinute: String(settings.defaultDurationMinute),
    bookingNoticeHour: String(settings.bookingNoticeHour),
    maxAdvanceDay: String(settings.maxAdvanceDay),
    bufferBeforeMinute: String(settings.bufferBeforeMinute),
    bufferAfterMinute: String(settings.bufferAfterMinute),
});

const draftId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const toDraftBlock = (block: MentorAvailabilityBlock): AvailabilityDraftBlock => ({
    localId: block.id,
    weekday: block.weekday,
    startTime: block.startTime,
    endTime: block.endTime,
    isActive: block.isActive,
});

const timeToMinute = (value: string) => {
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
};

const validateAvailabilityBlocks = (blocks: AvailabilityDraftBlock[]) => {
    for (const block of blocks) {
        if (timeToMinute(block.startTime) >= timeToMinute(block.endTime)) {
            return 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc.';
        }
    }

    for (const weekday of WEEKDAYS) {
        const dayBlocks = blocks
            .filter((block) => block.weekday === weekday.value && block.isActive)
            .sort((first, second) => timeToMinute(first.startTime) - timeToMinute(second.startTime));

        for (let index = 1; index < dayBlocks.length; index += 1) {
            if (timeToMinute(dayBlocks[index].startTime) < timeToMinute(dayBlocks[index - 1].endTime)) {
                return `${weekday.label} đang có khung giờ bị chồng lấn.`;
            }
        }
    }

    return null;
};

const parseSettingsForm = (form: SettingsForm) => {
    const settings = {
        minDurationMinute: Number(form.minDurationMinute),
        maxDurationMinute: Number(form.maxDurationMinute),
        defaultDurationMinute: Number(form.defaultDurationMinute),
        bookingNoticeHour: Number(form.bookingNoticeHour),
        maxAdvanceDay: Number(form.maxAdvanceDay),
        bufferBeforeMinute: Number(form.bufferBeforeMinute),
        bufferAfterMinute: Number(form.bufferAfterMinute),
    };

    if (Object.values(settings).some((value) => !Number.isFinite(value) || !Number.isInteger(value))) {
        throw new Error('Cài đặt đặt lịch phải là số nguyên hợp lệ.');
    }

    if (settings.minDurationMinute < 30 || settings.maxDurationMinute < settings.minDurationMinute) {
        throw new Error('Khoảng thời lượng tư vấn không hợp lệ.');
    }

    if (settings.defaultDurationMinute < settings.minDurationMinute || settings.defaultDurationMinute > settings.maxDurationMinute) {
        throw new Error('Thời lượng mặc định phải nằm trong khoảng tối thiểu và tối đa.');
    }

    if ([settings.minDurationMinute, settings.maxDurationMinute, settings.defaultDurationMinute].some((value) => value % 30 !== 0)) {
        throw new Error('Thời lượng tư vấn phải theo bước 30 phút.');
    }

    return settings;
};

export default function MentorAvailabilityPage() {
    const queryClient = useQueryClient();
    const [blocksDraft, setBlocksDraft] = useState<AvailabilityDraftBlock[] | null>(null);
    const [settingsFormDraft, setSettingsFormDraft] = useState<SettingsForm | null>(null);

    const availabilityQuery = useQuery({
        queryKey: bookingQueryKeys.mentorAvailability,
        queryFn: bookingApi.getMentorAvailability,
    });

    const settingsQuery = useQuery({
        queryKey: bookingQueryKeys.mentorBookingSettings,
        queryFn: bookingApi.getMentorBookingSettings,
    });

    const blocks = blocksDraft ?? availabilityQuery.data?.blocks.map(toDraftBlock) ?? [];
    const settingsForm = settingsFormDraft ?? (
        settingsQuery.data?.settings ? settingsToForm(settingsQuery.data.settings) : defaultSettingsForm
    );

    const blocksByWeekday = useMemo(() => {
        const grouped = new Map<number, AvailabilityDraftBlock[]>();
        for (const weekday of WEEKDAYS) {
            grouped.set(weekday.value, blocks.filter((block) => block.weekday === weekday.value));
        }
        return grouped;
    }, [blocks]);

    const saveAvailabilityMutation = useMutation({
        mutationFn: () => {
            const validationError = validateAvailabilityBlocks(blocks);
            if (validationError) throw new Error(validationError);

            return bookingApi.updateMentorAvailability({
                blocks: blocks.map((block) => ({
                    weekday: block.weekday,
                    startTime: block.startTime,
                    endTime: block.endTime,
                    isActive: block.isActive,
                })),
            });
        },
        onSuccess: async (data) => {
            setBlocksDraft(data.blocks.map(toDraftBlock));
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mentorAvailability });
            toast.success('Đã lưu khung giờ tư vấn.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể lưu khung giờ tư vấn.'));
        },
    });

    const saveSettingsMutation = useMutation({
        mutationFn: () => bookingApi.updateMentorBookingSettings(parseSettingsForm(settingsForm)),
        onSuccess: async (data) => {
            setSettingsFormDraft(settingsToForm(data.settings));
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.mentorBookingSettings });
            toast.success('Đã lưu cài đặt đặt lịch.');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể lưu cài đặt đặt lịch.'));
        },
    });

    const addBlock = (weekday: number) => {
        setBlocksDraft((current) => [
            ...(current ?? blocks),
            {
                localId: draftId(),
                weekday,
                startTime: '18:30',
                endTime: '19:30',
                isActive: true,
            },
        ]);
    };

    const updateBlock = (localId: string, field: 'startTime' | 'endTime', value: string) => {
        setBlocksDraft((current) => (current ?? blocks).map((block) => (block.localId === localId ? { ...block, [field]: value } : block)));
    };

    const removeBlock = (localId: string) => {
        setBlocksDraft((current) => (current ?? blocks).filter((block) => block.localId !== localId));
    };

    const updateSettingsField = (field: keyof SettingsForm, value: string) => {
        setSettingsFormDraft((current) => ({ ...(current ?? settingsForm), [field]: value }));
    };

    if (availabilityQuery.isLoading || settingsQuery.isLoading) {
        return (
            <div className="flex h-[420px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Khung giờ tư vấn — Mentor Portal — IT Compass</title>
            </Helmet>

            <div className="space-y-6 p-6 sm:p-8 lg:p-10">
                <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mentor Portal</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Khung giờ tư vấn</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Thiết lập lịch rảnh theo tuần để học viên chọn ngày, giờ bắt đầu và thời lượng phù hợp.
                    </p>
                </motion.header>

                {(availabilityQuery.error || settingsQuery.error) && (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {getErrorMessage(availabilityQuery.error || settingsQuery.error, 'Không thể tải dữ liệu đặt lịch.')}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                    <Card className="rounded-[28px] border-border/70 shadow-xl shadow-primary/5">
                        <CardHeader className="space-y-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <CalendarClock size={20} />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight">Lịch rảnh hàng tuần</CardTitle>
                            <CardDescription className="text-sm leading-6">
                                Mỗi khung giờ sẽ được dùng để sinh slot đặt lịch theo thời lượng học viên chọn.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {WEEKDAYS.map((weekday) => {
                                const dayBlocks = blocksByWeekday.get(weekday.value) ?? [];
                                return (
                                    <section key={weekday.value} className="rounded-3xl border border-border/60 bg-surface/35 p-4">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h2 className="font-bold text-foreground">{weekday.label}</h2>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {dayBlocks.length ? `${dayBlocks.length} khung giờ` : 'Chưa có khung giờ'}
                                                </p>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => addBlock(weekday.value)}>
                                                <Plus size={15} /> Thêm khung
                                            </Button>
                                        </div>

                                        {dayBlocks.length > 0 && (
                                            <div className="mt-4 space-y-3">
                                                {dayBlocks.map((block) => (
                                                    <div key={block.localId} className="grid gap-3 rounded-2xl border border-border/60 bg-background p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                                        <Input
                                                            label="Bắt đầu"
                                                            type="time"
                                                            value={block.startTime}
                                                            onChange={(event) => updateBlock(block.localId, 'startTime', event.target.value)}
                                                        />
                                                        <Input
                                                            label="Kết thúc"
                                                            type="time"
                                                            value={block.endTime}
                                                            onChange={(event) => updateBlock(block.localId, 'endTime', event.target.value)}
                                                        />
                                                        <Button type="button" variant="outline" size="icon" onClick={() => removeBlock(block.localId)} aria-label="Xóa khung giờ">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}

                            <div className="flex justify-end">
                                <Button type="button" size="lg" isLoading={saveAvailabilityMutation.isPending} onClick={() => saveAvailabilityMutation.mutate()}>
                                    <Save size={17} /> Lưu khung giờ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-border/70 shadow-xl shadow-primary/5 xl:sticky xl:top-6">
                        <CardHeader className="space-y-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Settings2 size={20} />
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight">Cài đặt đặt lịch</CardTitle>
                            <CardDescription className="text-sm leading-6">
                                Thời lượng luôn theo bước 30 phút để khớp yêu cầu đặt lịch của học viên.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                <Input label="Tối thiểu (phút)" type="number" min={30} step={30} value={settingsForm.minDurationMinute} onChange={(event) => updateSettingsField('minDurationMinute', event.target.value)} />
                                <Input label="Tối đa (phút)" type="number" min={30} step={30} value={settingsForm.maxDurationMinute} onChange={(event) => updateSettingsField('maxDurationMinute', event.target.value)} />
                                <Input label="Mặc định (phút)" type="number" min={30} step={30} value={settingsForm.defaultDurationMinute} onChange={(event) => updateSettingsField('defaultDurationMinute', event.target.value)} />
                                <Input label="Báo trước (giờ)" type="number" min={0} value={settingsForm.bookingNoticeHour} onChange={(event) => updateSettingsField('bookingNoticeHour', event.target.value)} />
                                <Input label="Đặt trước tối đa (ngày)" type="number" min={1} value={settingsForm.maxAdvanceDay} onChange={(event) => updateSettingsField('maxAdvanceDay', event.target.value)} />
                                <Input label="Buffer trước (phút)" type="number" min={0} step={30} value={settingsForm.bufferBeforeMinute} onChange={(event) => updateSettingsField('bufferBeforeMinute', event.target.value)} />
                                <Input label="Buffer sau (phút)" type="number" min={0} step={30} value={settingsForm.bufferAfterMinute} onChange={(event) => updateSettingsField('bufferAfterMinute', event.target.value)} />
                            </div>
                            <Button type="button" className="w-full" isLoading={saveSettingsMutation.isPending} onClick={() => saveSettingsMutation.mutate()}>
                                <Clock3 size={17} /> Lưu cài đặt
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
