import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '../src/components/layout/Header';
import { NotificationBell } from '../src/components/shared/NotificationBell';
import { AdminSidebar } from '../src/components/layout/AdminSidebar';
import { MentorSidebar } from '../src/components/layout/MentorSidebar';

// Mock contexts
vi.mock('../src/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { fullName: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
        isAuthenticated: true,
        isLoading: false,
        logout: vi.fn(),
    }),
}));

vi.mock('../src/lib/notificationApi', () => ({
    notificationApi: {
        getUnreadCount: vi.fn().mockResolvedValue({ unreadCount: 3 }),
        listNotifications: vi.fn().mockResolvedValue({ notifications: [] }),
        markAsRead: vi.fn().mockResolvedValue({ message: 'ok' }),
        markAllAsRead: vi.fn().mockResolvedValue({ message: 'ok' }),
    },
}));

describe('Icon Buttons Accessibility', () => {
    afterEach(() => {
        cleanup();
    });

    const createQueryClient = () => new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    it('Header user menu button has accessible label and popup attribute', () => {
        const queryClient = createQueryClient();
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <Header />
                </MemoryRouter>
            </QueryClientProvider>
        );
        const button = screen.getByRole('button', { name: 'Menu tài khoản' });
        expect(button).toBeDefined();
        expect(button.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('NotificationBell toggle and close buttons have accessible labels', async () => {
        const queryClient = createQueryClient();
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <NotificationBell />
                </MemoryRouter>
            </QueryClientProvider>
        );

        const bellButton = screen.getByRole('button', { name: /Thông báo/ });
        expect(bellButton).toBeDefined();
        expect(bellButton.getAttribute('aria-haspopup')).toBe('dialog');

        // Open notification dropdown
        fireEvent.click(bellButton);

        const closeButton = screen.getByRole('button', { name: 'Đóng bảng thông báo' });
        expect(closeButton).toBeDefined();
    });

    it('AdminSidebar has accessible label for collapse button', () => {
        render(
            <MemoryRouter>
                <AdminSidebar collapsed={false} />
            </MemoryRouter>
        );
        const collapseBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' });
        expect(collapseBtn).toBeDefined();
    });

    it('MentorSidebar has accessible label for collapse button', () => {
        const queryClient = createQueryClient();
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    <MentorSidebar collapsed={false} />
                </MemoryRouter>
            </QueryClientProvider>
        );
        const collapseBtn = screen.getByRole('button', { name: 'Thu gọn sidebar' });
        expect(collapseBtn).toBeDefined();
    });
});
