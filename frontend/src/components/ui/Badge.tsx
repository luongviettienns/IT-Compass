import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                accent: 'border-transparent bg-accent/10 text-accent',
                destructive: 'border-transparent bg-destructive/10 text-destructive',
                success: 'border-transparent bg-success/10 text-success',
                outline: 'text-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
