import type { ReactNode } from 'react';
import { Loader } from '../ui/Loader';
import { Button } from '../ui/Button';
import { getErrorMessage } from '../../lib/appError';

type QueryState = {
    isPending: boolean;
    isError: boolean;
    isFetching: boolean;
    error: unknown;
    refetch: () => Promise<unknown>;
};

/** Only successful reads may present counts, empty states or actionable rows. */
export function AdminQueryBoundary({ query, label, hasData = true, compact = false, retryLabel = 'Thử lại', children }: {
    query: QueryState;
    label: string;
    hasData?: boolean;
    compact?: boolean;
    retryLabel?: string;
    children: ReactNode;
}) {
    if (query.isPending) {
        return <div role="status" className={`flex items-center gap-3 text-sm text-muted-foreground ${compact ? 'py-3' : 'justify-center p-8'}`}><Loader /><span>Đang tải {label}…</span></div>;
    }
    if (query.isError || !hasData) {
        return <div role="alert" className={`space-y-2 text-sm text-destructive ${compact ? 'pt-3' : 'rounded-2xl border border-destructive/20 bg-destructive/5 p-5'}`}>
            <p className="font-semibold">Không thể tải {label}.</p>
            <p>{getErrorMessage(query.error, 'Dữ liệu chưa sẵn sàng. Vui lòng thử lại.')}</p>
            <Button variant="outline" size="sm" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>{query.isFetching ? 'Đang thử lại…' : retryLabel}</Button>
        </div>;
    }
    return <>{query.isFetching && <p role="status" className="py-2 text-xs text-muted-foreground">Đang cập nhật {label}…</p>}{children}</>;
}
