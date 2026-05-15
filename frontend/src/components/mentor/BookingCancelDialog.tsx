import { useState } from 'react';
import { X } from 'lucide-react';

import type { MentorBooking } from '../../lib/bookingApi';
import { Button } from '../ui/Button';

type BookingCancelDialogProps = {
    booking: MentorBooking | null;
    title: string;
    description: string;
    confirmText?: string;
    reasonPlaceholder?: string;
    isPending?: boolean;
    onClose: () => void;
    onConfirm: (booking: MentorBooking, reason: string) => void;
};

const MAX_REASON_LENGTH = 500;

function BookingCancelDialogContent({
    booking,
    title,
    description,
    confirmText = 'Xác nhận hủy',
    reasonPlaceholder = 'Nhập lý do hủy lịch...',
    isPending = false,
    onClose,
    onConfirm,
}: BookingCancelDialogProps & { booking: MentorBooking }) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const normalizedReason = reason.trim();
    const isConfirmDisabled = isPending || !normalizedReason;

    const handleConfirm = () => {
        if (!normalizedReason) {
            setError('Vui lòng nhập lý do hủy lịch.');
            return;
        }

        onConfirm(booking, normalizedReason);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                onClick={isPending ? undefined : onClose}
                aria-label="Đóng hộp thoại hủy lịch"
            />
            <section className="relative w-full max-w-lg rounded-[28px] border border-border bg-background p-6 shadow-2xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Hủy lịch tư vấn</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{title}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Đóng"
                    >
                        <X size={18} />
                    </button>
                </div>

                <label className="mt-5 block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Lý do hủy</span>
                    <textarea
                        value={reason}
                        maxLength={MAX_REASON_LENGTH}
                        onChange={(event) => {
                            setReason(event.target.value);
                            setError('');
                        }}
                        placeholder={reasonPlaceholder}
                        className="min-h-28 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </label>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <p className="text-destructive">{error}</p>
                    <p className="shrink-0 text-muted-foreground">{reason.length}/{MAX_REASON_LENGTH}</p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
                        Giữ lịch
                    </Button>
                    <Button type="button" variant="destructive" disabled={isConfirmDisabled} isLoading={isPending} onClick={handleConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </section>
        </div>
    );
}

export function BookingCancelDialog(props: BookingCancelDialogProps) {
    if (!props.booking) return null;

    return <BookingCancelDialogContent key={props.booking.id} {...props} booking={props.booking} />;
}
