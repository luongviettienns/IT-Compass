import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BookingStatusBadge } from '../src/components/mentor/BookingStatusBadge';

describe('Multi-Signal Status Badge', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders text and an svg icon for REQUESTED status', () => {
        const { container } = render(<BookingStatusBadge status="REQUESTED" />);
        expect(screen.getByText('Chờ mentor xác nhận')).toBeDefined();
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders text and an svg icon for CONFIRMED status', () => {
        const { container } = render(<BookingStatusBadge status="CONFIRMED" />);
        expect(screen.getByText('Đã xác nhận')).toBeDefined();
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders text and an svg icon for NO_SHOW status', () => {
        const { container } = render(<BookingStatusBadge status="NO_SHOW" />);
        expect(screen.getByText('Không tham dự')).toBeDefined();
        const svg = container.querySelector('svg');
        expect(svg).toBeDefined();
    });
});
