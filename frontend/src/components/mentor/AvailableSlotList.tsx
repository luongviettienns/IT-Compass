import { Clock3 } from 'lucide-react';

import type { AvailabilitySlot } from '../../lib/bookingApi';
import { cn } from '../../lib/utils';

export type AvailableSlotListProps = {
    slots: AvailabilitySlot[];
    selectedStartTime: string;
    onSelect: (slot: AvailabilitySlot) => void;
    isLoading?: boolean;
};

export function AvailableSlotList({ slots, selectedStartTime, onSelect, isLoading }: AvailableSlotListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-11 animate-pulse rounded-xl bg-secondary" />
                ))}
            </div>
        );
    }

    if (!slots.length) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-5 text-center text-sm text-muted-foreground">
                Chưa có khung giờ phù hợp cho ngày và thời lượng đã chọn.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => {
                const selected = selectedStartTime === slot.startTime;
                return (
                    <button
                        key={`${slot.date}-${slot.startTime}-${slot.durationMinute}`}
                        type="button"
                        onClick={() => onSelect(slot)}
                        className={cn(
                            'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors',
                            selected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5',
                        )}
                    >
                        <Clock3 size={15} /> {slot.startTime}
                    </button>
                );
            })}
        </div>
    );
}
