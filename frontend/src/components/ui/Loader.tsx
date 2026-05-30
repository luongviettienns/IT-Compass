import { cn } from '../../lib/utils';

export function Loader({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
    const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

    return (
        <div
            role="status"
            aria-label="Loading"
            className={cn('loader-spin rounded-full border-2 border-current border-t-transparent text-primary', sizeMap[size], className)}
        />
    );
}
