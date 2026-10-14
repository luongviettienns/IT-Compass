import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '../src/contexts/AuthContext';
import { beforeEach, vi } from 'vitest';

describe('Landmarks and Skip Link', () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });
    it('renders a skip link pointing to #main-content', () => {
        const queryClient = new QueryClient();
        render(
            <HelmetProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <MemoryRouter initialEntries={['/']}>
                            <App />
                        </MemoryRouter>
                    </AuthProvider>
                </QueryClientProvider>
            </HelmetProvider>
        );

        const skipLink = screen.getByRole('link', { name: /chuyển đến nội dung chính/i });
        expect(skipLink).toBeTruthy();
        expect(skipLink.getAttribute('href')).toBe('#main-content');
    });
});
