import { useEffect, useId, useRef, useCallback } from 'react';

export type UseDialogA11yOptions = {
    isOpen: boolean;
    onClose: () => void;
    titleId?: string;
    descriptionId?: string;
    isPending?: boolean;
    hasUnsavedChanges?: boolean;
    confirmDiscardMessage?: string;
    closeOnEscape?: boolean;
    closeOnBackdropClick?: boolean;
    initialFocusRef?: React.RefObject<HTMLElement | null>;
    restoreFocus?: boolean;
};

export type UseDialogA11yReturn = {
    dialogRef: React.RefObject<HTMLDivElement | null>;
    titleId: string;
    descriptionId: string;
    dialogProps: {
        role: 'dialog';
        'aria-modal': true;
        'aria-labelledby': string;
        'aria-describedby'?: string;
        'aria-busy'?: boolean;
        tabIndex: -1;
    };
    handleBackdropClick: (e: React.MouseEvent) => void;
    requestClose: () => void;
};

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

let openDialogCount = 0;
let originalBodyOverflow = '';

export function _resetDialogA11yCountForTesting() {
    openDialogCount = 0;
    originalBodyOverflow = '';
}

export function useDialogA11y({
    isOpen,
    onClose,
    titleId: customTitleId,
    descriptionId: customDescId,
    isPending = false,
    hasUnsavedChanges = false,
    confirmDiscardMessage = 'Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?',
    closeOnEscape = true,
    closeOnBackdropClick = true,
    initialFocusRef,
    restoreFocus = true,
}: UseDialogA11yOptions): UseDialogA11yReturn {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const autoTitleId = useId();
    const autoDescId = useId();

    const titleId = customTitleId || autoTitleId;
    const descriptionId = customDescId || autoDescId;

    const requestClose = useCallback(() => {
        if (isPending) return;

        if (hasUnsavedChanges) {
            const confirmed = window.confirm(confirmDiscardMessage);
            if (!confirmed) return;
        }

        onClose();
    }, [isPending, hasUnsavedChanges, confirmDiscardMessage, onClose]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (!closeOnBackdropClick) return;
        if (e.target === e.currentTarget) {
            requestClose();
        }
    }, [closeOnBackdropClick, requestClose]);

    // Body scroll lock with active counter to support stacked dialogs
    useEffect(() => {
        if (!isOpen) return;

        if (openDialogCount === 0) {
            originalBodyOverflow = document.body.style.overflow;
        }
        document.body.style.overflow = 'hidden';
        openDialogCount++;

        return () => {
            openDialogCount = Math.max(0, openDialogCount - 1);
            if (openDialogCount === 0) {
                document.body.style.overflow = originalBodyOverflow;
            }
        };
    }, [isOpen]);

    // Focus management (initial focus, restore focus, focus trap) & Escape listener
    useEffect(() => {
        if (!isOpen) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;

        const focusInitialElement = () => {
            if (!dialogRef.current) return;
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
                return;
            }
            const firstFocusable = dialogRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
            if (firstFocusable) {
                firstFocusable.focus();
            } else {
                dialogRef.current.focus();
            }
        };

        // Try focusing immediately and schedule a frame in case of delayed mount/animation
        focusInitialElement();
        const animFrame = requestAnimationFrame(focusInitialElement);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                e.stopPropagation();
                requestClose();
                return;
            }

            if (e.key === 'Tab' && dialogRef.current) {
                const focusables = Array.from(
                    dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
                ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

                if (focusables.length === 0) {
                    e.preventDefault();
                    dialogRef.current.focus();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first || document.activeElement === dialogRef.current) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            cancelAnimationFrame(animFrame);
            window.removeEventListener('keydown', handleKeyDown);

            if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus();
            }
        };
    }, [isOpen, closeOnEscape, initialFocusRef, restoreFocus, requestClose]);

    const dialogProps: UseDialogA11yReturn['dialogProps'] = {
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': titleId,
        ...(customDescId ? { 'aria-describedby': customDescId } : {}),
        ...(isPending ? { 'aria-busy': true } : {}),
        tabIndex: -1,
    };

    return {
        dialogRef,
        titleId,
        descriptionId,
        dialogProps,
        handleBackdropClick,
        requestClose,
    };
}
