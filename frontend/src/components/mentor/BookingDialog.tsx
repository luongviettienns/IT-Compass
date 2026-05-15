import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock3, FileText, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';

import { bookingApi, type AvailabilitySlot } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { getErrorMessage } from '../../lib/appError';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AvailableSlotList } from './AvailableSlotList';

type BookingDialogProps = {
    slug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type BookingStep = 'select' | 'confirm';
type BookingMode = 'slot' | 'custom';

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const formatReviewDate = (date: string) => {
    if (!date) return 'Chưa chọn ngày';

    return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const addMinutesToTime = (time: string, durationMinute: number) => {
    const [hourPart, minutePart] = time.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart);

    if (!Number.isInteger(hour) || !Number.isInteger(minute)) return '';

    const endMinute = hour * 60 + minute + durationMinute;
    if (endMinute > 24 * 60) return '';

    const endHour = Math.floor(endMinute / 60);
    const normalizedMinute = endMinute % 60;
    return `${String(endHour).padStart(2, '0')}:${String(normalizedMinute).padStart(2, '0')}`;
};

const isValidTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function BookingDialog({ slug, open, onOpenChange }: BookingDialogProps) {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(todayInputValue);
    const [selectedDurationMinute, setSelectedDurationMinute] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [bookingMode, setBookingMode] = useState<BookingMode>('slot');
    const [customStartTime, setCustomStartTime] = useState('');
    const [note, setNote] = useState('');
    const [step, setStep] = useState<BookingStep>('select');

    const configQuery = useQuery({
        queryKey: bookingQueryKeys.config(slug),
        queryFn: () => bookingApi.getPublicBookingConfig(slug),
        enabled: open && Boolean(slug),
    });

    const durationOptions = configQuery.data?.durationOptions ?? [30, 60, 90, 120];
    const durationMinute = durationOptions.includes(selectedDurationMinute ?? -1)
        ? selectedDurationMinute ?? durationOptions[0]
        : configQuery.data?.settings.defaultDurationMinute ?? durationOptions[0];

    const availabilityQuery = useQuery({
        queryKey: bookingQueryKeys.availability(slug, date, durationMinute),
        queryFn: () => bookingApi.getPublicAvailability(slug, date, durationMinute),
        enabled: open && Boolean(slug) && Boolean(date) && Boolean(durationMinute),
    });

    const slots = useMemo(() => availabilityQuery.data?.slots ?? [], [availabilityQuery.data?.slots]);
    const activeSlot = selectedSlot && slots.some((slot) => slot.startTime === selectedSlot.startTime)
        ? selectedSlot
        : null;
    const customEndTime = customStartTime ? addMinutesToTime(customStartTime, durationMinute) : '';
    const customTimeValid = isValidTime(customStartTime) && Boolean(customEndTime);
    const selectedStartTime = bookingMode === 'slot' ? activeSlot?.startTime ?? '' : customStartTime;
    const selectedEndTime = bookingMode === 'slot' ? activeSlot?.endTime ?? '' : customEndTime;
    const canContinue = bookingMode === 'slot' ? Boolean(activeSlot) : customTimeValid;
    const mentorName = configQuery.data?.mentor.name ?? availabilityQuery.data?.mentor.name ?? 'mentor';

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [onOpenChange, open]);

    useEffect(() => {
        if (open) {
            setStep('select');
        } else {
            setBookingMode('slot');
            setCustomStartTime('');
        }
    }, [open]);

    const createBookingMutation = useMutation({
        mutationFn: () => {
            if (!selectedStartTime || !selectedEndTime) {
                throw new Error(bookingMode === 'slot' ? 'Vui lòng chọn khung giờ tư vấn.' : 'Vui lòng nhập giờ đề xuất hợp lệ.');
            }

            return bookingApi.createBooking(slug, {
                date,
                startTime: selectedStartTime,
                durationMinute,
                requestType: bookingMode === 'slot' ? 'AVAILABILITY_SLOT' : 'CUSTOM_TIME',
                note: note.trim() || null,
            });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.availability(slug, date, durationMinute) });
            await queryClient.invalidateQueries({ queryKey: bookingQueryKeys.studentRoot });
            toast.success('Đã gửi yêu cầu đặt lịch. Vui lòng chờ mentor xác nhận.');
            onOpenChange(false);
            setSelectedSlot(null);
            setBookingMode('slot');
            setCustomStartTime('');
            setNote('');
            setStep('select');
        },
        onError: (error) => {
            toast.error(getErrorMessage(error, 'Không thể gửi yêu cầu đặt lịch.'));
        },
    });

    if (!open) return null;

    const showSelectionStep = step === 'select';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
                aria-label="Đóng đặt lịch"
            />
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-dialog-title"
                className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl shadow-slate-950/20"
            >
                <header className="flex items-start justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                            <CalendarClock size={14} /> Đặt lịch tư vấn
                        </div>
                        <h2 id="booking-dialog-title" className="mt-3 text-2xl font-black tracking-tight text-foreground">
                            {showSelectionStep ? 'Chọn thời gian phù hợp' : 'Xác nhận yêu cầu đặt lịch'}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {showSelectionStep
                                ? 'Lịch sẽ ở trạng thái chờ cho đến khi mentor xác nhận.'
                                : 'Kiểm tra lại thông tin trước khi gửi yêu cầu cho mentor.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Đóng"
                    >
                        <X size={18} />
                    </button>
                </header>

                <div className="space-y-5 overflow-y-auto p-5 sm:p-6">
                    {showSelectionStep ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Ngày tư vấn"
                                    type="date"
                                    min={todayInputValue()}
                                    value={date}
                                    onChange={(event) => {
                                        setDate(event.target.value);
                                        setSelectedSlot(null);
                                        setCustomStartTime('');
                                    }}
                                />
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium text-foreground">Thời lượng</span>
                                    <select
                                        value={durationMinute}
                                        onChange={(event) => {
                                            setSelectedDurationMinute(Number(event.target.value));
                                            setSelectedSlot(null);
                                        }}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {durationOptions.map((option) => (
                                            <option key={option} value={option}>{option} phút</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBookingMode('slot');
                                        setCustomStartTime('');
                                    }}
                                    className={`rounded-2xl border p-4 text-left transition-colors ${bookingMode === 'slot' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                                >
                                    <span className="text-sm font-bold">Chọn giờ mentor đã mở</span>
                                    <span className="mt-1 block text-xs leading-5">Phù hợp khi bạn thấy slot còn trống trong lịch mentor.</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBookingMode('custom');
                                        setSelectedSlot(null);
                                    }}
                                    className={`rounded-2xl border p-4 text-left transition-colors ${bookingMode === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'}`}
                                >
                                    <span className="text-sm font-bold">Đề xuất giờ riêng</span>
                                    <span className="mt-1 block text-xs leading-5">Gửi một khoảng giờ khác để mentor xem xét xác nhận.</span>
                                </button>
                            </div>

                            {bookingMode === 'slot' ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground">Khung giờ còn trống</p>
                                    <AvailableSlotList
                                        slots={slots}
                                        selectedStartTime={activeSlot?.startTime ?? ''}
                                        onSelect={(slot) => {
                                            setSelectedSlot(slot);
                                            setBookingMode('slot');
                                        }}
                                        isLoading={availabilityQuery.isLoading || configQuery.isLoading}
                                    />
                                    {!availabilityQuery.isLoading && !configQuery.isLoading && !availabilityQuery.error && !slots.length && (
                                        <div className="space-y-2 text-sm leading-6 text-muted-foreground">
                                            <p>
                                                Mentor có thể chưa mở lịch vào ngày này, hoặc các khung giờ phù hợp với thời lượng {durationMinute} phút đã được đặt.
                                            </p>
                                            <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setBookingMode('custom')}>
                                                Đề xuất giờ riêng cho mentor
                                            </button>
                                        </div>
                                    )}
                                    {availabilityQuery.error && (
                                        <p className="text-sm text-destructive">
                                            {getErrorMessage(availabilityQuery.error, 'Không thể tải khung giờ trống.')}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                    <Input
                                        label="Giờ bắt đầu bạn muốn đề xuất"
                                        type="time"
                                        step={1800}
                                        value={customStartTime}
                                        onChange={(event) => setCustomStartTime(event.target.value)}
                                    />
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Mentor chưa cần mở sẵn khung giờ này. Nếu đồng ý, mentor sẽ xác nhận và chat sẽ mở sau đó.
                                    </p>
                                    {customStartTime && !customEndTime && (
                                        <p className="text-sm text-destructive">Khoảng giờ đề xuất phải kết thúc trong cùng ngày.</p>
                                    )}
                                </div>
                            )}

                            <label className="space-y-1.5">
                                <span className="text-sm font-medium text-foreground">Ghi chú cho mentor</span>
                                <textarea
                                    value={note}
                                    maxLength={1000}
                                    onChange={(event) => setNote(event.target.value)}
                                    placeholder="Bạn muốn mentor hỗ trợ phần nào? Ví dụ: định hướng ngành, review CV, roadmap học tập..."
                                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </label>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                                    <CheckCircle2 size={18} /> Sẵn sàng gửi yêu cầu
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {bookingMode === 'custom'
                                        ? 'Đây là giờ bạn đề xuất riêng. Mentor sẽ xem xét và chat chỉ mở khi mentor đồng ý lịch tư vấn này.'
                                        : 'Sau khi gửi, lịch sẽ ở trạng thái chờ xác nhận. Chat chỉ mở khi mentor đồng ý lịch tư vấn này.'}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-border/70 bg-surface/30 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                        <UserRound size={14} /> Mentor
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-foreground">{mentorName}</p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-surface/30 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                        <CalendarClock size={14} /> Ngày tư vấn
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-foreground">{formatReviewDate(date)}</p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-surface/30 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                        <Clock3 size={14} /> Thời gian
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-foreground">
                                        {selectedStartTime && selectedEndTime ? `${selectedStartTime} - ${selectedEndTime}` : 'Chưa chọn giờ'}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold text-primary">
                                        {bookingMode === 'custom' ? 'Đề xuất giờ riêng' : 'Theo lịch mentor'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border/70 bg-surface/30 p-4">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                                        <FileText size={14} /> Thời lượng
                                    </div>
                                    <p className="mt-2 text-sm font-semibold text-foreground">{durationMinute} phút</p>
                                </div>
                            </div>

                            {note.trim() && (
                                <div className="rounded-2xl border border-border/70 bg-background p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Ghi chú gửi mentor</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.trim()}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <footer className="flex flex-col-reverse gap-3 border-t border-border/70 p-5 sm:flex-row sm:justify-end sm:p-6">
                    {showSelectionStep ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Để sau
                            </Button>
                            <Button type="button" disabled={!canContinue} onClick={() => setStep('confirm')}>
                                Tiếp tục xác nhận
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={() => setStep('select')}>
                                Quay lại chỉnh sửa
                            </Button>
                            <Button
                                type="button"
                                disabled={!canContinue}
                                isLoading={createBookingMutation.isPending}
                                onClick={() => createBookingMutation.mutate()}
                            >
                                Gửi yêu cầu đặt lịch
                            </Button>
                        </>
                    )}
                </footer>
            </section>
        </div>
    );
}
