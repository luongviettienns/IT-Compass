import { useState } from 'react';
import { Star, X } from 'lucide-react';

import type { MentorBooking } from '../../lib/bookingApi';
import { Button } from '../ui/Button';

type ReviewDialogProps = {
    booking: MentorBooking | null;
    isPending?: boolean;
    onClose: () => void;
    onConfirm: (booking: MentorBooking, input: { rating: number; comment: string }) => void;
};

const MAX_COMMENT_LENGTH = 1000;

function ReviewDialogContent({ booking, isPending = false, onClose, onConfirm }: ReviewDialogProps & { booking: MentorBooking }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const normalizedComment = comment.trim();
    const isDisabled = isPending || rating < 1 || rating > 5;

    const submit = () => {
        if (rating < 1 || rating > 5) {
            setError('Vui lòng chọn số sao.');
            return;
        }

        onConfirm(booking, { rating, comment: normalizedComment });
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
            <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={isPending ? undefined : onClose} aria-label="Đóng đánh giá mentor" />
            <section className="relative w-full max-w-lg rounded-[28px] border border-border bg-background p-6 shadow-2xl shadow-slate-950/20">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Đánh giá mentor</p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{booking.mentor.name}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Cho 1 nhận xét ngắn sau buổi tư vấn để giúp mentor và người học khác.</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isPending} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60" aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>

                <div className="mt-5">
                    <p className="text-sm font-semibold text-foreground">Bạn chấm mentor mấy sao?</p>
                    <div className="mt-3 flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, index) => {
                            const value = index + 1;
                            const active = value <= rating;
                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => { setRating(value); setError(''); }}
                                    className={`rounded-full p-1.5 transition-colors ${active ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-400'}`}
                                    aria-label={`${value} sao`}
                                >
                                    <Star size={24} fill={active ? 'currentColor' : 'none'} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <label className="mt-5 block space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Nhận xét</span>
                    <textarea
                        value={comment}
                        maxLength={MAX_COMMENT_LENGTH}
                        onChange={(event) => {
                            setComment(event.target.value);
                            setError('');
                        }}
                        placeholder="Mentor đã hỗ trợ bạn như thế nào?"
                        className="min-h-28 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                </label>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <p className="text-destructive">{error}</p>
                    <p className="shrink-0 text-muted-foreground">{comment.length}/{MAX_COMMENT_LENGTH}</p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>Để sau</Button>
                    <Button type="button" disabled={isDisabled} isLoading={isPending} onClick={submit}>Gửi đánh giá</Button>
                </div>
            </section>
        </div>
    );
}

export function ReviewDialog(props: ReviewDialogProps) {
    if (!props.booking) return null;
    return <ReviewDialogContent key={props.booking.id} {...props} booking={props.booking} />;
}
