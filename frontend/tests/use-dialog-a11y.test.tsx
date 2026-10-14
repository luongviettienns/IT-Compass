import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDialogA11y, _resetDialogA11yCountForTesting } from '../src/hooks/useDialogA11y';

describe('useDialogA11y hook', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        _resetDialogA11yCountForTesting();
        document.body.style.overflow = '';
    });

    it('provides standard dialog attributes and handles escape key', () => {
        const onClose = vi.fn();
        const { result } = renderHook(
            () => useDialogA11y({ isOpen: true, onClose })
        );

        expect(result.current.dialogProps.role).toBe('dialog');
        expect(result.current.dialogProps['aria-modal']).toBe(true);
        expect(result.current.titleId).toBeTruthy();
        expect(result.current.dialogProps['aria-labelledby']).toBe(result.current.titleId);
        expect(document.body.style.overflow).toBe('hidden');

        // Simulate Escape key
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClose when isPending is true', () => {
        const onClose = vi.fn();
        renderHook(() => useDialogA11y({ isOpen: true, onClose, isPending: true }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('prompts confirmation when hasUnsavedChanges is true before closing', () => {
        const onClose = vi.fn();
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderHook(() => useDialogA11y({
            isOpen: true,
            onClose,
            hasUnsavedChanges: true,
            confirmDiscardMessage: 'Bỏ thay đổi?',
        }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(confirmSpy).toHaveBeenCalledWith('Bỏ thay đổi?');
        expect(onClose).not.toHaveBeenCalled();

        confirmSpy.mockReturnValue(true);
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('restores body overflow when dialog is unmounted or closed', () => {
        const onClose = vi.fn();
        const { rerender, unmount } = renderHook(
            ({ isOpen }) => useDialogA11y({ isOpen, onClose }),
            { initialProps: { isOpen: true } }
        );

        expect(document.body.style.overflow).toBe('hidden');

        rerender({ isOpen: false });
        expect(document.body.style.overflow).toBe('');

        rerender({ isOpen: true });
        expect(document.body.style.overflow).toBe('hidden');

        unmount();
        expect(document.body.style.overflow).toBe('');
    });
});
