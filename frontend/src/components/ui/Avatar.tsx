import { cn } from '../../lib/utils';
import { User } from 'lucide-react';
import { toApiAssetUrl } from '../../lib/authApi';

type AvatarProps = {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
};

const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-24 w-24 text-2xl',
};

const iconSizeMap = { sm: 14, md: 16, lg: 20, xl: 32 };

export function Avatar({ src, alt = '', size = 'md', className }: AvatarProps) {
    const resolvedSrc = toApiAssetUrl(src);

    if (resolvedSrc) {
        return (
            <img
                src={resolvedSrc}
                alt={alt}
                className={cn('rounded-full object-cover bg-muted', sizeMap[size], className)}
            />
        );
    }

    return (
        <div
            className={cn(
                'flex items-center justify-center rounded-full bg-primary/10 text-primary',
                sizeMap[size],
                className,
            )}
        >
            <User size={iconSizeMap[size]} />
        </div>
    );
}
