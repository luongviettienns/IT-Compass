import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmoothScroll } from '../src/components/shared/SmoothScroll';

describe('SmoothScroll reduced motion', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('does not instantiate Lenis when prefers-reduced-motion is active', () => {
        window.matchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        const { container } = render(
            <SmoothScroll>
                <div>No motion content</div>
            </SmoothScroll>
        );

        expect(container.textContent).toBe('No motion content');
        expect(document.documentElement.classList.contains('lenis')).toBe(false);
    });
});
