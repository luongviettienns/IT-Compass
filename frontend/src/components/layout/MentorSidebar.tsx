/**
 * @file MentorSidebar.tsx - Sidebar cho Mentor Portal.
 *
 * Mobile: drawer overlay (slide-in), hamburger toggle từ MentorPage header.
 * Desktop: sidebar cố định, có thể collapse thành icon-only.
 */

import { NavLink, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    UserPen,
    Eye,
    CalendarClock,
    Clock3,
    MessageCircle,
    ChevronLeft,
    GraduationCap,
    LogOut,
    Home,
    X,
} from 'lucide-react';
import { bookingApi } from '../../lib/bookingApi';
import { bookingQueryKeys } from '../../lib/bookingQueryKeys';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { NotificationBell } from '../shared/NotificationBell';

const MENU_ITEMS: ReadonlyArray<{ label: string; path: string; icon: typeof LayoutDashboard; end?: boolean }> = [
    { label: 'Tổng quan', path: '/mentor', icon: LayoutDashboard, end: true },
    { label: 'Lịch tư vấn', path: '/mentor/bookings', icon: CalendarClock },
    { label: 'Tin nhắn', path: '/mentor/messages', icon: MessageCircle },
    { label: 'Khung giờ', path: '/mentor/availability', icon: Clock3 },
    { label: 'Hồ sơ', path: '/mentor/profile', icon: UserPen },
    { label: 'Xem trước', path: '/mentor/preview', icon: Eye },
];

type MentorSidebarProps = {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    collapsed?: boolean;
    onCollapsedChange?: (v: boolean) => void;
};

const getMenuBadge = (path: string, pendingBookingCount: number) => {
    if (path !== '/mentor/bookings' || pendingBookingCount <= 0) return null;
    return pendingBookingCount > 99 ? '99+' : String(pendingBookingCount);
};

export function MentorSidebar({ mobileOpen = false, onMobileClose, collapsed = false, onCollapsedChange }: MentorSidebarProps) {
    const { logout, user } = useAuth();
    const pendingBookingsQuery = useQuery({
        queryKey: bookingQueryKeys.mentorBookings({ status: 'REQUESTED', limit: 1 }),
        queryFn: () => bookingApi.listMentorBookings({ status: 'REQUESTED', limit: 1 }),
        enabled: user?.role === 'MENTOR',
        staleTime: 30_000,
    });
    const pendingBookingCount = pendingBookingsQuery.data?.pagination.total ?? 0;

    const SidebarContent = (
        <aside
            className={cn(
                'flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out',
                collapsed ? 'w-20' : 'w-64',
            )}
        >
            {/* Brand Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b shrink-0">
                <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 shrink-0">
                        <GraduationCap size={22} />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black uppercase tracking-tighter">IT Compass</span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                Mentor Portal
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <NotificationBell align="start" />

                    {/* Mobile close button */}
                    {onMobileClose && !collapsed && (
                        <button
                            onClick={onMobileClose}
                            className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors md:hidden"
                            aria-label="Đóng menu"
                        >
                            <X size={18} />
                        </button>
                    )}

                    {/* Desktop collapse button */}
                    {!collapsed && (
                        <button
                            onClick={() => onCollapsedChange?.(true)}
                            className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors hidden md:block"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Toggle Expand (when collapsed, desktop only) */}
            {collapsed && (
                <button
                    onClick={() => onCollapsedChange?.(false)}
                    className="absolute -right-3 top-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:text-primary transition-colors z-50"
                >
                    <ChevronLeft size={12} className="rotate-180" />
                </button>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden pt-6">
                {MENU_ITEMS.map((item) => {
                    const badge = getMenuBadge(item.path, pendingBookingCount);

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={onMobileClose}
                            className={({ isActive }) =>
                                cn(
                                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-[3px] border-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground border-l-[3px] border-transparent',
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn('shrink-0 transition-transform', !isActive && 'group-hover:scale-105')}
                                    />
                                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                                    {badge && (
                                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-bold leading-none text-destructive-foreground">
                                            {badge}
                                        </span>
                                    )}
                                    {collapsed && (
                                        <div className="absolute left-full ml-6 hidden rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block whitespace-nowrap z-[100]">
                                            {item.label}{badge ? ` · ${badge} chờ duyệt` : ''}
                                        </div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}

                {/* Decorative dot pattern */}
                <div className="mt-8 opacity-30 pointer-events-none" aria-hidden>
                    <div className="h-24 bg-[radial-gradient(circle,rgba(37,99,235,0.15)_1px,transparent_1px)] bg-[size:12px_12px]" />
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t p-4 space-y-2 shrink-0">
                {!collapsed && (
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
                        <Avatar
                            src={user?.profile?.avatarUrl}
                            alt={user?.fullName ?? ''}
                            size="sm"
                            className="ring-2 ring-primary/10 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">{user?.fullName}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                        </div>
                    </div>
                )}

                <Link
                    to="/"
                    onClick={onMobileClose}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
                        collapsed && 'justify-center',
                    )}
                >
                    <Home size={18} className="shrink-0" />
                    {!collapsed && <span>Về trang chủ</span>}
                </Link>

                <button
                    onClick={logout}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors',
                        collapsed && 'justify-center',
                    )}
                >
                    <LogOut size={18} className="shrink-0" />
                    {!collapsed && <span>Đăng xuất</span>}
                </button>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden md:flex shrink-0 relative">
                {SidebarContent}
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={onMobileClose}
                    />
                    {/* Drawer */}
                    <div className="relative animate-in slide-in-from-left duration-300">
                        {SidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}
