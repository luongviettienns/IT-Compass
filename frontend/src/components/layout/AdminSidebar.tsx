/**
 * @file AdminSidebar.tsx - Sidebar cho Admin Portal.
 *
 * Mobile: drawer overlay (slide-in), hamburger toggle từ header.
 * Desktop: sidebar cố định, có thể collapse thành icon-only.
 */

import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    ShieldAlert,
    ChevronLeft,
    Compass,
    LogOut,
    Settings,
    ClipboardList,
    MessageSquare,
    X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';

const MENU_ITEMS: ReadonlyArray<{ label: string; path: string; icon: typeof LayoutDashboard; end?: boolean }> = [
    { label: 'Tổng quan', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Người dùng', path: '/admin/users', icon: Users },
    { label: 'Mentor', path: '/admin/mentors', icon: UserCheck },
    { label: 'Nội dung (CMS)', path: '/admin/blogs', icon: FileText },
    { label: 'Bình luận blog', path: '/admin/blog-comments', icon: MessageSquare },
    { label: 'Assessment', path: '/admin/assessments', icon: ClipboardList },
    { label: 'Nhật ký hệ thống', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Cài đặt', path: '/admin/settings', icon: Settings },
];

type AdminSidebarProps = {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    collapsed?: boolean;
    onCollapsedChange?: (v: boolean) => void;
};

export function AdminSidebar({ mobileOpen = false, onMobileClose, collapsed = false, onCollapsedChange }: AdminSidebarProps) {
    const { logout, user } = useAuth();

    const SidebarContent = (
        <aside
            className={cn(
                'flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out',
                collapsed ? 'w-20' : 'w-64',
            )}
        >
            {/* ── Brand Header ──────────────────────────────────── */}
            <div className="relative flex h-16 items-center justify-between border-b px-4 overflow-hidden shrink-0">
                {/* Dot pattern decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                <div className={cn('relative flex items-center gap-3', collapsed && 'justify-center w-full')}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 shrink-0">
                        <Compass size={22} />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black uppercase tracking-tighter">IT Compass</span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">
                                Administrator
                            </span>
                        </div>
                    )}
                </div>

                {/* Mobile close button */}
                {onMobileClose && !collapsed && (
                    <button
                        onClick={onMobileClose}
                        className="relative rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors md:hidden"
                        aria-label="Đóng menu"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Desktop collapse button */}
                {!collapsed && (
                    <button
                        onClick={() => onCollapsedChange?.(true)}
                        className="relative rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors hidden md:block"
                    >
                        <ChevronLeft size={18} />
                    </button>
                )}
            </div>

            {/* ── Toggle Expand (when collapsed, desktop only) ──────────────── */}
            {collapsed && (
                <button
                    onClick={() => onCollapsedChange?.(false)}
                    className="absolute -right-3 top-20 hidden md:flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:text-primary transition-colors z-50"
                >
                    <ChevronLeft size={12} className="rotate-180" />
                </button>
            )}

            {/* ── Navigation ────────────────────────────────────── */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden pt-6">
                {MENU_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onMobileClose}
                        className={({ isActive }) =>
                            cn(
                                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-primary/8 text-primary font-bold'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Active left border accent */}
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                                )}
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                                {collapsed && (
                                    <div className="absolute left-full ml-6 hidden rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background group-hover:block whitespace-nowrap z-[100] shadow-xl">
                                        {item.label}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* ── Footer / User Profile ─────────────────────────── */}
            <div className="border-t p-4 space-y-2 shrink-0">
                {!collapsed && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5">
                        <Avatar
                            src={undefined}
                            alt={user?.fullName || 'Admin'}
                            size="sm"
                            className="ring-2 ring-primary/15 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate">{user?.fullName}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
                        </div>
                    </div>
                )}

                <NavLink
                    to="/"
                    onClick={onMobileClose}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                    <Compass size={18} className="shrink-0" />
                    {!collapsed && <span>Về trang chính</span>}
                </NavLink>

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
            {/* Desktop sidebar - luôn hiển thị */}
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
