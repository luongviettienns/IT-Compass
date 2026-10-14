import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BookingCancelDialog } from '../src/components/mentor/BookingCancelDialog';
import { ReviewDialog } from '../src/components/mentor/ReviewDialog';
import type { MentorBooking } from '../src/lib/bookingApi';

const dummyBooking = {
    id: 101,
    bookingCode: 'BKG-101',
    status: 'CONFIRMED',
    slot: { startTime: new Date().toISOString(), endTime: new Date().toISOString() },
    mentor: { id: 1, name: 'Nguyễn Văn A', avatar: '' },
    student: { id: 2, fullName: 'Trần Thị B', email: 'b@example.com' },
} as unknown as MentorBooking;

describe('Modal Dialog Accessibility', () => {
    afterEach(() => {
        cleanup();
    });

    it('BookingCancelDialog renders with proper dialog role and accessible name', () => {
        render(
            <BookingCancelDialog
                booking={dummyBooking}
                title="Hủy lịch hẹn"
                description="Bạn có chắc muốn hủy?"
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                isPending={false}
            />
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeTruthy();
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Đóng' })).toBeTruthy();
    });

    it('ReviewDialog renders with proper dialog role and accessible name', () => {
        render(
            <ReviewDialog
                booking={dummyBooking}
                onClose={vi.fn()}
                onConfirm={vi.fn()}
                isPending={false}
            />
        );
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeTruthy();
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Đóng' })).toBeTruthy();
    });
});
