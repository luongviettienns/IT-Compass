/**
 * @file AdminActionDialog.tsx - Reusable confirm dialog for admin actions.
 *
 * Now with AnimatePresence + backdrop fade + dialog scale-in animation.
 * Supports 4 tones (primary/destructive/warning/success), text/textarea/datetime inputs.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

type AdminActionDialogProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText: string;
    cancelText?: string;
    tone?: 'primary' | 'destructive' | 'warning' | 'success';
    isPending?: boolean;
    inputLabel?: string;
    inputPlaceholder?: string;
    inputDefaultValue?: string;
    inputType?: 'text' | 'textarea' | 'datetime-local';
    requireInput?: boolean;
    minLength?: number;
    maxLength?: number;
    onClose: () => void;
    onConfirm: (value: string) => void;
};

const toneClassMap = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
    warning: 'bg-amber-500 text-white hover:bg-amber-500/90',
    success: 'bg-emerald-500 text-white hover:bg-emerald-500/90',
} satisfies Record<NonNullable<AdminActionDialogProps['tone']>, string>;

export const AdminActionDialog: React.FC<AdminActionDialogProps> = ({
    isOpen,
    title,
    description,
    confirmText,
    cancelText = 'Hủy',
    tone = 'primary',
    isPending = false,
    inputLabel,
    inputPlaceholder,
    inputDefaultValue = '',
    inputType = 'text',
    requireInput = false,
    minLength,
    maxLength,
    onClose,
    onConfirm,
}) => {
    const [value, setValue] = useState(inputDefaultValue);
    const normalizedValue = value.trim();
    const inputMinLength = typeof minLength === 'number' ? Math.max(minLength, requireInput ? 1 : 0) : requireInput ? 1 : undefined;
    const inputMaxLength = typeof maxLength === 'number' ? Math.max(maxLength, 0) : undefined;
    const isValueMissing = requireInput && normalizedValue.length === 0;
    const isValueTooShort = typeof inputMinLength === 'number' && normalizedValue.length > 0 && normalizedValue.length < inputMinLength;
    const isValueTooLong = typeof inputMaxLength === 'number' && normalizedValue.length > inputMaxLength;
    const isConfirmDisabled = isPending || isValueMissing || isValueTooShort || isValueTooLong;

    useEffect(() => {
        if (isOpen) {
            setValue(inputDefaultValue);
        }
    }, [inputDefaultValue, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const inputBaseClass = 'w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary';

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[120] bg-background/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-md rounded-[28px] border bg-card shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 border-b p-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black">{title}</h2>
                                    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                                </div>
                                <button onClick={onClose} className="rounded-full bg-secondary p-2 transition-colors hover:bg-secondary/70">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {(inputLabel || inputPlaceholder) ? (
                                <div className="space-y-2 p-6 pb-0">
                                    {inputLabel ? <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{inputLabel}</label> : null}
                                    {inputType === 'textarea' ? (
                                        <textarea
                                            rows={4}
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder={inputPlaceholder}
                                            minLength={inputMinLength}
                                            maxLength={inputMaxLength}
                                            className={`${inputBaseClass} resize-none`}
                                        />
                                    ) : (
                                        <input
                                            type={inputType}
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder={inputPlaceholder}
                                            minLength={inputMinLength}
                                            maxLength={inputMaxLength}
                                            className={inputBaseClass}
                                        />
                                    )}
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-3 p-6">
                                <button
                                    onClick={onClose}
                                    className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary/70"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => onConfirm(value)}
                                    disabled={isConfirmDisabled}
                                    className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-50 hover:scale-105 active:scale-95 ${toneClassMap[tone]}`}
                                >
                                    {isPending ? 'Đang xử lý...' : confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
