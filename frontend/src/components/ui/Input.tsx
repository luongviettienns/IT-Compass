import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    helperText?: string;
    icon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, icon, id, 'aria-describedby': customDescribedBy, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : generatedId);
        const errorId = `${inputId}-error`;
        const helperId = `${inputId}-helper`;

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
                    <label htmlFor={inputId} className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                            'placeholder:text-muted-foreground',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                            icon && 'pl-10',
                            error && 'border-destructive focus-visible:ring-destructive',
                            className,
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
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
Input.displayName = 'Input';

export { Input };
