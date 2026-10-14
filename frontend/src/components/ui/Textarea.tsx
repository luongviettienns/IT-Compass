import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    helperText?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, helperText, id, 'aria-describedby': customDescribedBy, ...props }, ref) => {
        const generatedId = useId();
        const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
        const errorId = `${textareaId}-error`;
        const helperId = `${textareaId}-helper`;

        const describedBy = [
            error ? errorId : null,
            helperText ? helperId : null,
            customDescribedBy,
        ]
            .filter(Boolean)
            .join(' ') || undefined;

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-destructive focus-visible:ring-destructive',
                        className,
                    )}
                    ref={ref}
                    {...props}
                />
                {error && (
                    <p id={errorId} role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                {!error && helperText && (
                    <p id={helperId} className="text-sm text-muted-foreground">
                        {helperText}
                    </p>
                )}
            </div>
        );
    },
);
Textarea.displayName = 'Textarea';

export { Textarea };
