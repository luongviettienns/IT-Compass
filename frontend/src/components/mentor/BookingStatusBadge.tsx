import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { getBookingStatusLabel, type BookingCancellationActor, type BookingStatus } from '../../lib/bookingApi';
import { Clock, CheckCircle2, XCircle, CheckCheck, UserX, AlertCircle } from 'lucide-react';

const statusClassName: Record<BookingStatus, string> = {
    REQUESTED: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
    CONFIRMED: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
    CANCELLED_BY_STUDENT: 'border-slate-500/20 bg-slate-500/10 text-slate-600',
    CANCELLED_BY_MENTOR: 'border-rose-500/20 bg-rose-500/10 text-rose-700',
    COMPLETED: 'border-blue-500/20 bg-blue-500/10 text-blue-700',
    NO_SHOW: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-700',
};

function renderStatusIcon(status: BookingStatus, needsReview: boolean, requestExpired: boolean) {
    if (requestExpired) return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    if (needsReview) return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    switch (status) {
        case 'REQUESTED':
            return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
        case 'CONFIRMED':
            return <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
        case 'CANCELLED_BY_STUDENT':
        case 'CANCELLED_BY_MENTOR':
            return <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
        case 'COMPLETED':
            return <CheckCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
        case 'NO_SHOW':
            return <UserX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
        default:
            return <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
    }
}

type BookingStatusBadgeProps = {
    status: BookingStatus;
    outcomeReviewRequired?: boolean;
    requestExpired?: boolean;
    cancelledBy?: BookingCancellationActor | null;
    className?: string;
};

export function BookingStatusBadge({ status, outcomeReviewRequired = false, requestExpired = false, cancelledBy, className }: BookingStatusBadgeProps) {
    const needsReview = status === 'CONFIRMED' && outcomeReviewRequired;

    return (
        <Badge variant="outline" className={cn('inline-flex items-center gap-1.5 px-3 py-1', statusClassName[requestExpired ? 'CANCELLED_BY_STUDENT' : needsReview ? 'REQUESTED' : status], className)}>
            {renderStatusIcon(status, needsReview, requestExpired)}
            <span>{getBookingStatusLabel(status, needsReview, requestExpired, cancelledBy)}</span>
        </Badge>
    );
}
